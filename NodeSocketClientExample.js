const WebSocket = require('ws')
const url = 'ws://localhost:8081'
const connection = new WebSocket(url)
 
connection.onopen = () => {
  connection.send('Message From Client') 
}
 
connection.onerror = (error) => {
  console.log(`WebSocket error: ${JSON.stringify(error)}`)
}
 
connection.onmessage = (e) => {
  console.log(e.data)
}