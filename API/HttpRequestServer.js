//const express = require('express');
//const axios = require('axios');  // Usato per comunicare con ServiceManager

import express from 'express';
import axios from 'axios';

export default class HttpRequestServer {

    constructor(port = 3000) {
        this.app = express();  // Inizializza un'app Express
        this.port = port;      // Imposta la porta su cui il server HTTP ascolterà

        this.ITEMS = [];
        
        this._initializeMiddlewares();
        this._initializeRoutes();
    }

    // Metodo privato per inizializzare i middleware
    _initializeMiddlewares() {
        // Middleware per il parsing delle richieste JSON
        this.app.use(express.json());
        console.log('Middlewares inizializzati');
    }

    // Metodo privato per inizializzare le rotte
    _initializeRoutes() {
        // Definisce una rotta di esempio per l'endpoint di base
        this.app.get('/', (req, res) => {
            res.send('Benvenuto nel server REST API!');
        });

        // Definisce altre rotte di esempio per API CRUD
        this.app.get('/api/items', this.getItems.bind(this));
        this.app.post('/api/items', this.createItem.bind(this));
        this.app.put('/api/items/:id', this.updateItem.bind(this));
        this.app.delete('/api/items/:id', this.deleteItem.bind(this));

        console.log('Rotte inizializzate');
    }

    // Metodo per avviare il server
    start() {
        this.app.listen(this.port, () => {
            console.log(`Server avviato sulla porta ${this.port}`);
        });
    }

    // Controller per la richiesta GET
    getItems(req, res) {
        res.status(200).json(this.ITEMS);
    }

    // Controller per la richiesta POST
    createItem(req, res) {
        const newItem = {
            id: Date.now(),   // Genera un ID univoco basato sul timestamp
            name: req.body.name
        };
        this.ITEMS.push(newItem);
        res.status(201).json({ message: 'Oggetto creato con successo', item: newItem });
    }

    // Controller per la richiesta PUT
    updateItem(req, res) {
        const itemId = req.params.id;
        const updatedItem = {
            id: itemId,
            name: req.body.name
        };
        res.status(200).json({ message: `Oggetto con ID ${itemId} aggiornato`, item: updatedItem });
    }

    // Controller per la richiesta DELETE
    deleteItem(req, res) {
        const itemId = req.params.id;
        res.status(200).json({ message: `Oggetto con ID ${itemId} eliminato` });
    }
}

class GSEngine_test {
    constructor(port = 3001, serviceManagerUrl = 'http://localhost:5000') {
        this.app = express();
        this.port = port;
        this.serviceManagerUrl = serviceManagerUrl;
        this.config = {};  // Configurazioni ottenute dal ServiceManager
    }

    async start() {
        await this.registerWithServiceManager();
        await this.getConfigFromServiceManager();
        this._initializeRoutes();

        // Avvia il server
        this.app.listen(this.port, () => {
            console.log(`GS-Engine in ascolto sulla porta ${this.port}`);
        });

        // Invia heartbeat periodico al ServiceManager
        setInterval(this.sendHeartbeat.bind(this), 10000);
    }

    // Registrazione con ServiceManager
    async registerWithServiceManager() {
        try {
            const response = await axios.post(`${this.serviceManagerUrl}/register`, {
                serviceName: 'GSEngine',
                serviceUrl: `http://localhost:${this.port}`
            });
            console.log(response.data);
        } catch (error) {
            console.error('Errore nella registrazione con ServiceManager:', error.message);
        }
    }

    // Recupera configurazione da ServiceManager
    async getConfigFromServiceManager() {
        try {
            const response = await axios.get(`${this.serviceManagerUrl}/config/GSEngine`);
            this.config = response.data;
            console.log('Configurazione ricevuta:', this.config);
        } catch (error) {
            console.error('Errore nel recupero della configurazione:', error.message);
        }
    }

    // Invia heartbeat a ServiceManager
    async sendHeartbeat() {
        try {
            await axios.post(`${this.serviceManagerUrl}/heartbeat`, { serviceName: 'GSEngine' });
            console.log('Heartbeat inviato a ServiceManager');
        } catch (error) {
            console.error('Errore nell\'invio del heartbeat:', error.message);
        }
    }

    // Inizializza le rotte REST
    _initializeRoutes() {
        this.app.get('/', (req, res) => {
            res.send('GS-Engine attivo');
        });
    }
}