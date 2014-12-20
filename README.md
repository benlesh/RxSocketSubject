RxSocketSubject
===============

[![Build Status](https://travis-ci.org/blesh/RxSocketSubject.svg?branch=master)](https://travis-ci.org/blesh/RxSocketSubject)

A more advanced web socket wrapper for RxJS

### Goals

The goals of this project is to produce an observable WebSocket implementation that meets a set of common
needs for projects I'm currently working on. RxJS-DOM has a fine WebSocket implementation, which I modelled the initial
work on this implementation off of. However, I need something that also does the following:

- Socket that will automatically reconnect itself.
- Socket that will automatically try additional endpoints.
- Has seperate hooks for open, close, and error.
- Will send proper close messages with WebSocket close codes to the server when `onError` is called.
- Will send a close command to the server when `onCompleted` is called.
- Will always force a single instance of a socket regardless of the number of subscriptions.