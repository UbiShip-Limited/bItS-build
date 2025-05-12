"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = __importStar(require("./server"));
// Import other application-level modules like routes, plugins, services as they are developed.
// Example:
// import authPlugin from './auth/authPlugin';
// import userRoutes from './api/users/userRoutes';
const main = async () => {
    try {
        // Register application-specific plugins, routes, hooks, etc.
        // For example:
        // await server.register(authPlugin);
        // await server.register(userRoutes, { prefix: '/api/v1/users' });
        server_1.default.log.info('Application setup complete. Starting server...');
        await (0, server_1.start)();
    }
    catch (err) {
        // Use server.log if available, otherwise console.error
        const log = server_1.default?.log || console;
        log.error('Error starting application:', err);
        process.exit(1);
    }
};
main();
//# sourceMappingURL=app.js.map