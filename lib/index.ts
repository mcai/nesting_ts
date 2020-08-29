import express from 'express';
import cors from 'cors';

function startServer() {
    const app = express();

    app.use(express.json());
    app.use(express.urlencoded({extended: true}));

    app.use(cors());

    app.get('/', (req, res) => {
        return res.send('Received a GET HTTP method');
    });

    app.post('/', (req, res) => {
        return res.send('Received a POST HTTP method');
    });

    app.get('*', function(req, res){
        return res.status(404).send(`404 error: not found: ${req.url}`);
    });

    let port = 5001;

    app.listen(port, () =>
        console.log(`nesting listening on port ${port}!`),
    );
}
