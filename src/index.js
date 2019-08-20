const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const  { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

// app pour l'appel de express
const app = express()
// server pour l'appel du protocole http pour app
const server = http.createServer(app)
// io pour l'appel de la doc de la biblio socket.io
// désormais notre serveur prend en charge les sockets web
const io = socketio(server)
// port pour l'appel du serveur sur le port choisi
const port = process.env.PORT || 3000
// chemin du repertoire public que nous allons lier
const publicDirectoryPath = path.join(__dirname, '../public')

// static middleware
app.use(express.static(publicDirectoryPath))

// creation d'un compteur des clients connectés
// on l'initialise a 0
let count = 0

// server (emit) -> client (receive) - countUpdated
// client (emit) -> server (receive) - increment

// ecouteur d'event qui permet de savoir quand un client se connecte au serveur
// io.on() on = connecté et on défini le message que qu'on veut qu'il renvoi (ici new websocketconnexion) 
// (socket) est un objet qui contient les infos sur la nouvelle connexion de l'user
io.on('connection', (socket) => {
    console.log('New WebSocket connection')
    //il y a 4 moyens pour le server d'emettre un event : 
    // - socket.emit() = envoi un event a un client spécifique
    // - .broadcast.emit() = diffuse pts par pts à tous les clients connectés
    // - io.emit() = envoi un event a chaque client connecté 
    // - io.to.emit() =  fonction qui emet un event pour tout le monde mais dans une salle spécifique
    // envoi un msg uniquement pour les personnes présentes dans la room
    // - socket.broadcast.to.emit() = similaire au dernier sauf qu'il envoi un msg seulement a une personne en particulier présent dans la room

    // rappel de join énoncé dans chat.js
    socket.on('join', (options, callback) => {
        // insertion des données du fichiers ./utils/users.js
        const { error, user } = addUser({ id: socket.id, ...options })


        if (error) {
            return callback(error)
        }
        // socket.join permet de rejoindre une salle de discussion donnée
        socket.join(user.room)
   
        // socket.emit() trasnmet des données simples comme une connexion
    // on choisi d'envoyer un msg de bienvenue au client
    socket.emit('message', generateMessage('Admin', 'Welcome!'))
    // .broadcast.emit() envoi un message en particulier à tous les connectés
    socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))
    io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
    })
    callback()
    })

    // fonction de rappel qui s'execute lorsqu'un nouveau message est envoyé 
    // on ajoute une callback fonction reconnaitre l'event passé ici
    socket.on('sendMessage', (message, callback) => {
    // send messages to correct room
    const user = getUser(socket.id)
    // on souhaite s'assurer que l'envoi du msg de contient pas de language profaneur
    // on instancie un filtre qui permettre de reguler le language utilisé
    const filter = new Filter()
    if (filter.isProfane(message)) {
        // si c'est utilisé on fait un return qui stop l'execution du msg
        return callback('Profanity is not allowed!')
    }
    // lorsque je recois un msg, je souhaite l'envoyer à tous les clients connectés
    // je n'oublie PAS d'emettre l'event du message et ses données
    // io.emit envoi un message à tous les connectés 
        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })
    // // .emit() permet d'envoyer et recevoir des elements
    // // on les reçois dans le fichiers client : ici c'est /js/chat.js
    // socket.emit('countUpdated', count)
    // // utilisation de socket.on pour l'utilisation sur le server
    // socket.on('increment', () => {
    //     // increment infini
    //     count++
    //     // ensuite on s'assure que le client obtient bien le nombre en temps réel
    //     // socket.emit('countUpadted', count)
    //     // appeler io au lieu de socket permet d'emettre un event sur chaque nouvelle connexion
    //     // et a plusieurs clients en meme temps sur differentes fenetres simultanément
    //     io.emit('countUpadted', count)
    // })
    // determination de la localité de l'user
    // coords est la fonction de callback 
    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })
    // socket.on() trasnmet des données simples comme une connexion
    // on choisi d'envoyer un msg de deconnexion d'un user au client
    // lorsque je recois un msg, je souhaite l'envoyer à tous les clients connectés
    socket.on('disconnect', () => {
        // retirer l'user
        const user = removeUser(socket.id)

        if (user) {
    // dans ce cas, je n'ai pas besoin de diffuser le message car le client a déja été déconnecté
    // il ne peut donc pas recevoir le message
    // on va donc envoyé un message seulement aux clients encore connectés
    io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
    io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
    })
        }
    })    
})

// lecture du server pour le démarrer
server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})
