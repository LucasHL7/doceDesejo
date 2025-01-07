const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/send-whatsapp', async (req, res) => {
    const { nome, numero, tipo-bolo, massa, recheio } = req.body;

    const message = `
        Nome: ${nome}
        Número: ${numero}
        Tipo de Bolo: ${tipo-bolo}
        Massa: ${massa}
        Recheio: ${recheio}
    `;

    try {
        // Enviar a mensagem usando a API do WhatsApp Business
        const response = await axios.post('https://graph.facebook.com/v11.0/<PHONE_NUMBER_ID>/messages', {
            messaging_product: 'whatsapp',
            to: numero,
            text: { body: message }
        }, {
            headers: {
                'Authorization': `Bearer <ACCESS_TOKEN>`,
                'Content-Type': 'application/json'
            }
        });

        res.status(200).send('Mensagem enviada com sucesso!');
    } catch (error) {
        console.error('Erro ao enviar a mensagem:', error);
        res.status(500).send('Erro ao enviar a mensagem.');
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
