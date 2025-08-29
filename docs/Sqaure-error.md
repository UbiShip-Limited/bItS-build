This is a new API error we are encountering We need to solve this and come up with a solution .We have access to the clients accounts to make changes if need be 

Square booking sync failed: SquareError: Status code: 401
Body: {
  "errors": [
    {
      "category": "AUTHENTICATION_ERROR",
      "code": "UNAUTHORIZED",
      "detail": "Merchant not onboarded to Appointments"
    }
  ]
}
    at Bookings.<anonymous> (C:\Users\maxmd\DEVops\myProjects\bowenislandtattooshop\node_modules\square\api\resources\bookings\client\Client.js:152:27)
    at Generator.next (<anonymous>)
    at fulfilled (C:\Users\maxmd\DEVops\myProjects\bowenislandtattooshop\node_modules\square\api\resources\bookings\client\Client.js:41:58)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5) {
  statusCode: 401,
  body: { errors: [ [Object] ] },
  errors: [
    {
      category: 'AUTHENTICATION_ERROR',
      code: 'UNAUTHORIZED',
      detail: 'Merchant not onboarded to Appointments'
    }
  ]
}
[SquareBookingSyncJob] Sync completed in 853ms
[SquareBookingSyncJob] Results: { synced: 0, created: 0, updated: 0, errors: 0 }
[00:24:24 UTC] INFO: Initial Square sync completed: 0 bookings synced