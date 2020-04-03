/* jshint esversion: 8 */
const dgram = require('dgram');

/**
 * The RaftNode class is an instance of a node in a Raft distributed network.
 */
class RaftNode {
  /**
   * @param {String} [configurationFilename]
   * @param {String} [nodeNumber]
   */
  constructor(configurationFilename, nodeNumber) {
    const config = require('./config.json');

    // Establish this node's identity and that they are in sync with other nodes
    this.name = `node${nodeNumber}`;

    this.address = config.nodes[`${this.name}`];

    this.hostname = this.address.split(':')[0];

    this.port = this.address.split(':')[1];
    this.port = parseInt(this.port, 10);

    // Open port for all receiving messages
    this.openSocket(this.hostname, this.port);

    // Loop checking for leader or receiving heartbeat messages or whatnot
    this.loop();
  }

  /**
   * @param {String} [hostname] The hostname to be opened.
   * @param {Number} [port] The port number to be opened.
   */
  openSocket(hostname, port) {
    /**
     * @param {socket} [socket] The socket to close.
     */
    const closeSocket = (socket) => {
      socket.close();
    };

    const socket = dgram.createSocket('udp4');

    socket.on('error', (error) => {
      console.log('Error:', error);
      closeSocket(socket);
    });

    socket.on('listening', () => {
      const address = socket.address();
      console.log(`Listening on: ${address.address}:${address.port}`);
    });

    socket.on('message', (message, remoteAddressInfo) => {
      console.log(`Received ${message} from ${remoteAddressInfo.address}:${remoteAddressInfo.port}`);
    });

    socket.bind(port, hostname);
  }

  /**
   * @return {String} The name of the leader node, null if none are leader.
   */
  establishLeaderNode() {
    // Ping all possible nodes 10 times over a 1 second interval
    // Send a 'leader' identity request message to all nodes that respond
    // When a majority consensus is reached, return that node name
    return null;
  }

  /**
   * @return {null} This function should never return.
   */
  async loop() {
    const sleep = (ms) => {
      return new Promise((resolve, reject) => setTimeout(resolve, ms));
    };

    const getRandomFloat = (min, max) => {
      return Math.random() * (max - min) + min;
    };

    const timerMax = getRandomFloat(0.5, 1.5);
    let timer = timerMax;

    while (true) {
      await sleep(1000);

      this.leader = this.establishLeaderNode();
      // if leader do heartbeat message
      // if not leader check countdown timer and start election if needed

      console.log(new Date().getTime());
      console.log(this);
      console.log(timerMax);
    }
  }
}

const args = process.argv;
if (args.length < 4) {
  console.log('Correct syntax: node src/raftnode.js src/config.json <0-4>');
  process.exit();
}

new RaftNode(args[2], args[3]);
