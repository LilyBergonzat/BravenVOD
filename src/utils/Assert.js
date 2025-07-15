import { strict as assert } from 'node:assert';

export const assertString = variable => {
    assert(
        typeof variable === 'string',
        `Value "${variable}" should be a string.`,
    );
};

export const assertNumber = variable => {
    assert(
        typeof variable === 'number',
        `Value "${variable}" should be a number.`,
    );
};

export const assertRecord = (variable, keyType, valueType) => {
    assert(
        typeof variable === 'object',
        `Value "${variable}" should be an object.`,
    );

    for (const key of Object.keys(variable)) {
        assert(
            typeof key === keyType.toLowerCase(),
            `Key "${key}" should be a ${keyType.toLowerCase()}.`,
        );

        assert(
            typeof variable[key] === valueType.toLowerCase(),
            `Key "${variable[key]}" should be a ${valueType.toLowerCase()}.`,
        );
    }
}

export const assertArray = (variable, valueType) => {
    assert(
        Array.isArray(variable),
        `Value "${variable}" should be an array.`,
    );

    for (const value of variable) {
        assert(
            typeof value === valueType.toLowerCase(),
            `Value "${value}" should be a ${valueType.toLowerCase()}.`,
        );
    }
}
