const helper = require('../../common/helper');

const MemoryQueue = require('../../../src/common-logging/queue-memory');

helper.logHelper();

describe('queue-memory', () => {

  test('constructor creates empty queue', () => {
    const queue = new MemoryQueue();
    expect(queue).toBeTruthy();
    expect(queue.getLength()).toBe(0);
    expect(queue.isEmpty()).toBeTruthy();
  });

  test('enqueue adds item', () => {
    const queue = new MemoryQueue();
    queue.enqueue({value: 1});
    expect(queue.getLength()).toBe(1);
    expect(queue.isEmpty()).toBeFalsy();
  });

  test('peek returns item', () => {
    const queue = new MemoryQueue();
    queue.enqueue({value: 123});
    expect(queue.getLength()).toBe(1);
    expect(queue.isEmpty()).toBeFalsy();
    const item = queue.peek();
    expect(item.value).toBe(123);
  });

  test('peek returns undefined when no item', () => {
    const queue = new MemoryQueue();
    expect(queue.getLength()).toBe(0);
    expect(queue.isEmpty()).toBeTruthy();
    const item = queue.peek();
    expect(item).toBe(undefined);
  });

  test('dequeue pops item', () => {
    const queue = new MemoryQueue();
    queue.enqueue({value: 456});
    expect(queue.getLength()).toBe(1);
    expect(queue.isEmpty()).toBeFalsy();
    const item = queue.dequeue();
    expect(item.value).toBe(456);
    expect(queue.getLength()).toBe(0);
    expect(queue.isEmpty()).toBeTruthy();
  });

  test('dequeue returns undefined when no item', () => {
    const queue = new MemoryQueue();
    expect(queue.getLength()).toBe(0);
    expect(queue.isEmpty()).toBeTruthy();
    const item = queue.dequeue();
    expect(item).toBe(undefined);
  });

  test('dequeue with offset frees space', () => {
    const queue = new MemoryQueue();
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(i => queue.enqueue({value: i}));
    expect(queue.getLength()).toBe(10);
    queue.offset = 5;
    const item = queue.dequeue();
    expect(item.value).toBe(5);
    expect(queue.offset).toBe(0);
    expect(queue.getLength()).toBe(4);
    expect(queue.peek().value).toBe(6);
  });

});
