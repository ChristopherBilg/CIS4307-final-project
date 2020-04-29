# CIS4307-final-project
CIS 4307 - Implementing Leader Election in the Raft Protocol

## Running the program
1. Open 5 terminals and navigate to the 'CIS4307-final-project/' directory in each.
2. In any of the terminals run the command 'npm install' to install the dependencies for the program.
3. Running the following 5 commands using a unique one per terminal.
- 'npm run node0'
- 'npm run node1'
- 'npm run node2'
- 'npm run node3'
- 'npm run node4'
4. Test and play around with the functionality of the Raft leader election by closing each process. (Linux/Unix: Ctrl-C)

## Errors During Program Execution
During the execution of the above program, there is an error that occurs that I have not been able to remove. I debugged my code and found that the error is the result of having 3 or more running nodes, where each node will start the leader election even though only 3 of the 5 nodes are active. This should not be the case as you should need 4 or more running nodes in order to start the election. My apologies but I was not able to remedy this error due to everything happening with the COVID-19 outbreak and time constraints.
