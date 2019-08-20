// script pour l'écriture du chat et connecter au serveur en utilisant les web sockets
// io() est tout ce que nous avons besoin pour appeler le server
// ici c'est un fichier client qui permet de recevoir et envoyer les infos de l'event
const socket = io()

// server (emit) -> client (receive) --acknowledgement--> server
// client (emit) -> server (receive) --acknowledgement--> client

// ELEMENTSdocument.querySelector de l'html
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// TEMPLATES
const messageTemplate = document.querySelector('#message-template').innerHTML
const $locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// OPTIONS
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // recuperation du new msg element
    const $newMessage = $messages.lastElementChild
    // hauteur donnée du new msg
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Hauteur des messages du container
    const containerHeight = $messages.scrollHright

    // Comment faire scroller ?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

// on signale a socket d'envoyer le msg de bienvenue au client
socket.on('message', (message) => {
    console.log(message)
    // rendu du message en réel et non plus en console.log
    // on le rends diynamique
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

// LOCATION
socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render($locationMessageTemplate, {
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')

    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

// appel de l'increment html du formulaire avec l'input et l'écouteur d'event submit
$messageForm.addEventListener('submit', (e) => {
    // on retient l'envoi du form
    e.preventDefault()
    // on défini les attributs de nos 2 elements HTML
    // afin de les désactiver
    $messageFormButton.setAttribute('disabled', 'disabled')
    // on crée une const message avec comme cible l'event e. du #message-form
    const message = e.target.elements.message.value
    // .emit() permet d'envoyer et recevoir des elements
    // on les reçois dans le fichiers client : ici c'est sur l'envoi du form
    // et on transmet le message
    socket.emit('sendMessage', message, (error) => {
        // on réactive le bouton du formulaire
        $messageFormButton.removeAttribute('disabled')
        // on recupere sa valeur
        $messageFormInput.value = ''
        // pour garder le curseur focus sur l'input
        $messageFormInput.focus()
        // cette condition resulte du filtre anti profanation installé sur l'index.js
        if (error) {
            return console.log(error)
        }
        console.log('Message delivered!')
    })
})

// cible du button send-location en HTML afin d'écouter l'event au click
$sendLocationButton.addEventListener('click', () => {
    // condition de verification de l'existence de la geolocalisation
    if (!navigator.geolocation) {
        // stop l'écriture avec return
        return alert('Geolocation is not supported by your browser.')
    }
    // on désactive l'envoi de localité
    $sendLocationButton.setAttribute('disabled', 'disabled')
    // appel l'object qui contient les infos (position)
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', { 
            latitude: position.coords.latitude, 
            longitude: position.coords.longitude }, () => {
            // on réactive la localisation
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared!')
        })
    })
})



// // count est un callback fonction de index.js
// socket.on('countUpdated', (count) => {
//     console.log('The count has been updated!', count)
// })

// // appel de l'increment html du compteur avec l'écouteur d'event click
// document.querySelector('#increment').addEventListener('click', () => {
//     console.log('Clicked')
//     // .emit() permet d'envoyer et recevoir des elements
//     // on les reçois dans le fichiers client : ici c'est dans l'increment
//     socket.emit('increment')
// })

// socket.emit() pour emettre un nouvel evenement que le server va écouter
// on l'appelle 'join' et il va servir a accepter le nom de l'user et la salle choisie
socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})