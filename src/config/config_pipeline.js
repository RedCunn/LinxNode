const cookieParser = require('cookie-parser');
const cors = require('cors');
const morgan = require('morgan');
var express = require('express');

const configrouting=require('./config_routing_middleware');

module.exports=function(servExp){
    //------ configuracion de la pipeline del servidor express------------
    //middleware de terceros:
    // - cookie-parser: extrae de la pet.del cliente http-request, la cabecera Cookie, extrae su valor y lo mete en una prop.del objeto req.cookie
    // - body-parser: extrae de la pet.del cliente http-rerquest, del body los datos mandados en formato x-www-form-urlenconded o json extrae su valor y los mete en una prop.del objeto req.body
    // - cors: para evitar errores cross-origin-resouce-sharing
    servExp.use( cookieParser() );
    servExp.use(cors());
    servExp.use(express.json());
    servExp.use(morgan('dev')); // este module nos permite ver por consola las peticiones que nos están entrando, 
    //'dev' es para el formateado del mensaje 

    /*middleware propios:
    - enrutamiento <---- rutas o endpoints del servicio REST(FULL) montado en el servidor express, siempre devuelven datos formato JSON
                        el foramto de estas rutas:   /api/....    
     definido mediante modulo de codigo:  config_routing_middleware <---- exporta una funcion q recibe como
     parametro el serv.express en el cual quiero configurar los endpoints del enrutamiento     
    */
    configrouting(servExp);
}