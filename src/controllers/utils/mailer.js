const _ = require('lodash');
const nodemailer = require('nodemailer');

const config = {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'concepcion3espinas@gmail.com',
        pass: 'lxmh lcyz vtnj fvey'
    }
}

const transporter = nodemailer.createTransport(config)

const defautlMail = {
    from: 'Me <xxx@gmail.com>',
    text: 'test text'
}


module.exports = {
    sendAccountActivationEmail: (mail, token) => {
        
        //mail = _.merge({}, defaultMail, mail);
        
        const options = {
            from: 'Concepcion Tres Espinas <concepcion3espinas@gmail.com>',
            to: mail,
            subject: 'Activa tu cuenta de LINX',
            html: `<p>Haz clic en el siguiente enlace para activar tu cuenta: <a href="http://localhost:3000/api/Account/activate_account?token=${token}">Activar cuenta LINX</a></p>`
        }

        transporter.sendMail(options, function (error, info) {
            if (error) {
                console.error('Error al enviar correo:', error);
            } else {
                console.log('Correo enviado:', info.response);
            }
        });
    },
    sendResetPasswordEmail : (mail) => {

    }
}