import { NativeEventEmitter, NativeModules } from 'react-native';

class EventEmitterService {
  constructor() {
    this.eventEmitter = new NativeEventEmitter();
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    // Return an unsubscribe function
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const arr = this.listeners.get(event);
      const index = arr.indexOf(callback);
      if (index !== -1) {
        arr.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    console.log('EventEmitter emit:', event, data, 'listeners count:', this.listeners.has(event) ? this.listeners.get(event).length : 0)
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        callback(data);
      });
    }
  }

  removeAllListeners(event) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

export default new EventEmitterService();
