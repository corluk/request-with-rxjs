import { Middleware, Response } from './client';
import { Http2ServerRequest } from "http2"
import {Observable} from "rxjs"
import { Url } from "url"
import http , {IncomingMessage, RequestOptions}  from "http"

export interface Middleware {

    onResponseBegins : (response: IncomingMessage) => void
    onResponseEnds? :(response: Response) => void
    onRequest? : (options : RequestOptions) => void 
}
export interface Response extends IncomingMessage {

    body: Buffer
}
const MIDDLEWARES : Middleware[] = []

export const addMiddleware = (middleware : Middleware) =>{


    MIDDLEWARES.push(middleware)
}
const applyOnRequestEnds = (requestOptions : RequestOptions)=>{
    MIDDLEWARES
    .filter(middleware => typeof middleware.onRequest  == "function")
    .map(middleware => middleware.onRequest?.apply(null,[requestOptions]))
}

const applyOnResponseEnds = (response:Response)=>{

    MIDDLEWARES
    .filter(middleware => typeof middleware.onResponseEnds  == "function")
    .map(middleware => middleware.onResponseEnds?.apply(null,[response]))
}

const applyOnResponseBegins = (response:IncomingMessage)=>{

    MIDDLEWARES
    .filter(middleware => typeof middleware.onResponseBegins  == "function")
    .map(middleware => middleware.onResponseBegins?.apply(null,[response]))
}
export const request = (options : RequestOptions  ) => {

    const obs = new Observable<Response>(subscriber => {
        
        http.request(options, incomingmessage =>{

            let response = incomingmessage as Response
            applyOnResponseBegins(response)
            incomingmessage.on("data",(chunk)=>{
                 response.body += chunk

            })
            incomingmessage.on("end",()=>{
            
                applyOnResponseEnds(response)
                subscriber.next(response)

            })
            incomingmessage.on("error",(err)=>{
                subscriber.error(err)
            })
           
        })
        
    })
  
    
}