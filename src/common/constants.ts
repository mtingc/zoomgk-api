export enum RabbitMQ {
    UserQueue = 'users',
    SubscriptionQueue = 'subscriptions',
    GuestQueue = 'guests',
    EventQueue = 'events'
}

export enum UserMSG {
    CREATE = 'CREATE_USER',
    FIND_ALL = 'FIND_USERS',
    FIND_ONE = 'FIND_USER',
    UPDATE = 'UPDATE_USER',
    DELETE = 'DELETE_USER',
    CONFIRMED = 'CONFIRMED',
    VALID_USER = 'VALID_USER',
}

export enum SubscriptionMSG {
    CREATE = 'CREATE_SUBSCRIPTION',
    FIND_ALL = 'FIND_SUBSCRIPTIONS',
    FIND_ONE = 'FIND_SUBSCRIPTION',
    UPDATE = 'UPDATE_SUBSCRIPTION',
    DELETE = 'DELETE_SUBSCRIPTION'
}

export enum GuestMSG {
    CREATE = 'CREATE_GUEST',
    FIND_ALL = 'FIND_GUESTS',
    FIND_ONE = 'FIND_GUEST',
    UPDATE = 'UPDATE_GUEST',
    DELETE = 'DELETE_GUEST',
    VALID_GUEST = 'VALID_GUEST'
}

export enum EventMSG {
    CREATE = 'CREATE_EVENT',
    FIND_ALL = 'FIND_EVENTS',
    FIND_ONE = 'FIND_EVENT',
    UPDATE = 'UPDATE_EVENT',
    DELETE = 'DELETE_EVENT',
    ADD_GUEST = 'ADD_GUEST'
}