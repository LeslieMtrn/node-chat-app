const users = []

// addUser
const addUser = ({ id, username, room }) => {
    // clean the data
    // .trim() pour éviter le sespaces
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    // validate the datra
    if (!username || !room) {
        return {
            error: 'Username and room are required!'
        }
    }
    // check for existing user
    const existingUser = users.find(() => {
        return username.room === room && username.username === username
    })

    // validate username
    if(existingUser) {
        return {
            error: 'Username is in use!'
        }
    }
    // Store user
    const user = { id, username, room }
    users.push(user)
    return { user }
}

// test d'un nouvel user
addUser ({
    id: 22,
    username: 'Leslie',
    room: 'South Philly'
})

addUser ({
    id: 42,
    username: 'Mike',
    room: 'South Philly'
})

addUser ({
    id: 32,
    username: 'Andrew',
    room: 'Center City'
})

// removeUser
// l'id suffit a suppr un user
const removeUser = (id) => {
 const index = users.findIndex((user) => user.id === id)

 if (index !== -1) {
     // La méthode splice() modifie le contenu d'un tableau en retirant des éléments et/ou en ajoutant 
     // de nouveaux éléments à même le tableau.On peut ainsi vider ou remplacer une partie d'un tableau.
     return users.splice(index, 1)[0]
 }
}

// removeUser
const removedUser = removeUser(22)

console.log(removedUser)
console.log(users)


// getUser
// l'id suffit également pour selectionner l'user
const getUser = (id) => {
    return users.find((user) => user.id === id)
}

// getUsersInRoom
const getUsersInRoom = (room) => {
    room = room.trim().toLowerCase()
    return users.filter((user) => user.room === room)
}

const user = getUser(42)
console.log(user)

const userList = getUsersInRoom('fairmount')
console.log(userList)

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}

