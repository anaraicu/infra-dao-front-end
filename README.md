# InfraDAO Front-end Application
React TypeScript Web Interface for InfraDAO

https://infra-dao.web.app/

## Guide

### 1. Dev environment setup
- Clone this repo `git clone <repo-url>`
- Go to [InfraDAO](https://github.com/anaraicu/infra-dao) contract repo.
- Clone the repo and follow the instructions to set up the smart contract backend locally.
- In `infra-dao` Run local hardhat node and deploy the contracts. (Master contract setup - one time only)

### 2. Link the libraries 
- In `infra-dao` project, in terminal, run `npm link` to create local symlink. 
- In `infra-dao-front-end`, in terminal, run `npm link infra-dao` to link the local symlink to the frontend.

### 3. Run the app
- In `infra-dao-front-end` run `npm install` to install dependencies. 
- In `infra-dao-front-end` run `npm start` to start the frontend app. 
- Connect Metamask wallet to the 
[local hardhat network](https://medium.com/@kaishinaw/connecting-metamask-with-a-local-hardhat-network-7d8cea604dc6), 
and import node accounts. 
- Go to [localhost:3000](http://localhost:3000/) to see the app running.

> **NOTE:**  Sometimes the MetaMask wallet keeps the account transactions cached. 
> When starting a new hardhat node, the account nonce is reset. To avoid nonce errors, reset the MetaMask wallet 
> account transactions. For this go to `MetaMask -> My accounts -> Settings -> Advanced -> Clear Activity Tab Data`.

## Start browsing
- Connect the MetaMask wallet with one of the imported accounts
- Create an organisation and enter the preferred parameters. 
- Get voting power token, specify the amount. 
- Create a new proposal within the organisation. 
- Vote on an active proposal. 
- Create a sub-governance project with the preferred governance model.
- Create a new proposal within the sub-governance project.

## Deploy to Firebase
1. Create a new project in Firebase.
2. Add web app to the project.
3. Follow firebase instructions to configure the app.
4. Add firebase realtime database, firestore and firebase hosting to the project.
5. In InfraDAO-Frontend run `npm run build` to build the app.
6. In InfraDAO-Frontend run `firebase deploy` to deploy the app to firebase.

Alternatively (to 5 and 6), you can run the following command to build and deploy the app to firebase.
```shell
npm run deploy
```