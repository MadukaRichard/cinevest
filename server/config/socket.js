/**
 * ===========================================
 * Socket.io Instance Holder
 * ===========================================
 *
 * Shared module that stores the Socket.io server
 * instance so controllers can push events without
 * a circular import on server.js.
 */

let _io = null;

export const setIO = (io) => {
  _io = io;
};

export const getIO = () => _io;
