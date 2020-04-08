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
    this.config = require('./config.json');

    // Establish this node's identity and that they are in sync with other nodes
    this.name = `node${nodeNumber}`;

    this.address = this.config.nodes[`${this.name}`];

    this.hostname = this.address.split(':')[0];

    this.port = this.address.split(':')[1];
    this.port = parseInt(this.port, 10);

    this.round = 0;
    this.receivedMessages = {};

    // Leader
    this.timer = null;
    this.timerFull = null;
    this.leader = null;

    // Open port for all receiving messages
    this.socket = this.openSocket(this.hostname, this.port);

    // Loop checking for leader or receiving heartbeat messages or whatnot
    this.loop();
  }

  /**
   * @param {socket} [socket] The socket to close.
   */
  closeSocket(socket) {
    return;
  };

  /**
   * @param {String} [hostname] The hostname to be opened.
   * @param {Number} [port] The port number to be opened.
   * @return {Socket} [socket] The socket that was opened.
   */
  openSocket(hostname, port) {
    const pingNodes = (message) => {
      for (const node in this.config.nodes) {
        if (node === this.name) {
          continue;
        }

        const nodeAddress = this.config.nodes[`${node}`];
        const nodeHostname = nodeAddress.split(':')[0];
        const nodePort = parseInt(nodeAddress.split(':')[1], 10);

        this.socket.send(message, 0, message.length, nodePort, nodeHostname, (error) => {
          // DEBUG LOGS
          // console.log('Error:', error);
          // this.closeSocket(this.socket);
        });
      }
    };

    const socket = dgram.createSocket('udp4');

    socket.on('error', (error) => {
      console.log('Error:', error);
      this.closeSocket(socket);
    });

    socket.on('listening', () => {
      const address = socket.address();
      console.log(`Listening on: ${address.address}:${address.port}`);
    });

    socket.on('message', (message, remoteAddressInfo) => {
      console.log(`Received ${message} `+
                  `from ${remoteAddressInfo.address}` +
                  `:${remoteAddressInfo.port}`);

      message = JSON.parse(message);
      if (message.round > this.round) {
        this.round = message.round;
      }

      switch (message.type) {
        case 'getLeader':
          const responseMessage = {
            round: message.round,
            type: 'setLeader',
            leader: this.leader,
          };
          pingNodes(JSON.stringify(responseMessage));
          break;
        case 'setLeader':
          this.receivedMessages[`${message.round}`] = {};
          this.receivedMessages[`${message.round}`].leader = message.leader;

          if (this.leader === null && message.leader === null) {
            this.leader = this.name;
            break;
          }

          if (this.receivedMessages[`${message.round}`].count === undefined) {
            this.receivedMessages[`${message.round}`].count = 0;
          } else {
            this.receivedMessages[`${message.round}`].count += 1;
          }

          if (this.receivedMessages[`${message.round}`].count > this.config.N) {
            if (message.leader !== null) {
              this.leader = message.leader;
            }
            console.log(`Setting my value of leader to ${this.leader}`);
          }

          break;
        case 'heartbeat':
          this.timer = this.timerFull;
          break;
        default:
          console.log('Message type not valid or incorrectly set.');
          break;
      }
    });

    socket.bind(port, hostname);
    return socket;
  }

  /**
   * @return {null} Always returns null.
   */
  establishLeaderNode() {
    this.round += 1;

    for (const node in this.config.nodes) {
      if (node === this.name) {
        continue;
      }

      const pingNode = (node, message) => {
        const address = this.config.nodes[`${node}`];
        const hostname = address.split(':')[0];
        const port = parseInt(address.split(':')[1], 10);

        this.socket.send(message, 0, message.length, port, hostname, (error) => {
          // DEBUG LOGS
          // console.log('Error:', error);
          // this.closeSocket(this.socket);
        });
      };

      const message = {
        round: this.round,
        type: 'getLeader',
      };

      pingNode(node, JSON.stringify(message));
    }

    ((ms) => {
      return new Promise((resolve, reject) => setTimeout(resolve, ms));
    })(500);

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

    const pingNodes = (message) => {
      for (const node in this.config.nodes) {
        if (node === this.name) {
          continue;
        }

        const nodeAddress = this.config.nodes[`${node}`];
        const nodeHostname = nodeAddress.split(':')[0];
        const nodePort = parseInt(nodeAddress.split(':')[1], 10);

        this.socket.send(message, 0, message.length, nodePort, nodeHostname, (error) => {
          // DEBUG LOGS
          // console.log('Error:', error);
          // this.closeSocket(this.socket);
        });
      }
    };

    this.timerFull = getRandomFloat(0.5, 1.5);
    this.timer = this.timerFull;

    while (true) {
      await sleep(100);

      if (this.timer <= 0) {
        this.timer = this.timerFull;
        this.establishLeaderNode();
      } else {
        this.timer -= 0.1;
      }

      if (this.leader === this.name) {
        const message = {
          type: 'heartbeat',
        };

        pingNodes(JSON.stringify(message));
      }

      // DEBUG LOGS
      // console.log(new Date().getTime());
      // console.log(this);
    }
  }
}

const args = process.argv;
if (args.length < 4) {
  console.log('Correct syntax: node src/raftnode.js src/config.json <0-4>');
  process.exit();
}

new RaftNode(args[2], args[3]);
