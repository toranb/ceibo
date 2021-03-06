module('Unit');

test('returns a copy of the keys', function(assert) {
  var tree = Ceibo.create({ key: 'value' });

  assert.equal(tree.key, 'value');
});

test('evaluates a descriptor', function(assert) {
  var tree = Ceibo.create({
    key: {
      isDescriptor: true,
      get: function() {
        return 'value';
      }
    }
  });

  assert.equal(tree.key, 'value');
});

test('process definition recursively', function(assert) {
  var tree = Ceibo.create({
    key: {
      anotherKey: 'value'
    }
  });

  assert.equal(tree.key.anotherKey, 'value');
});

test('process descriptors recursively', function(assert) {
  var tree = Ceibo.create({
    key: {
      anotherKey: {
        isDescriptor: true,
        get: function() {
          return 'value';
        }
      }
    }
  });

  assert.equal(tree.key.anotherKey, 'value');
});

test('parent node is accessible', function(assert) {
  var tree = Ceibo.create({
    key: {
      anotherKey: 'value'
    }
  });

  assert.equal(Ceibo.parent(tree.key).key.anotherKey, 'value');
});

test('overrides how strings are built', function(assert) {
  var tree = Ceibo.create(
    { key: "value" },
    {
      builder: {
        string: function(treeBuilder, target, key, value) {
          target[key] = 'cuack ' + value;
        }
      }
    }
  );

  assert.equal(tree.key, 'cuack value');
});

test('support value in descriptors', function(assert) {
  function dynamic(definition) {
    return {
      isDescriptor: true,
      value: function(index) {
        var copy = {};

        for (var attr in definition) {
          copy[attr] = index + ' ' + definition[attr];
        }

        return copy;
      }
    };
  }

  var tree = Ceibo.create({
    key: dynamic({
      anotherKey: 'value'
    })
  });

  assert.equal(tree.key(1).anotherKey, '1 value');
  assert.equal(tree.key(2).anotherKey, '2 value');
});

test('allows dynamic segments to process descriptors', function(assert) {
  function dynamic(definition) {
    return {
      isDescriptor: true,
      value: function() {
        return Ceibo.create(definition);
      }
    };
  }

  var descriptor = {
    isDescriptor: true,
    get: function() {
      return 'value';
    }
  };

  var tree = Ceibo.create({
    key: dynamic({
      anotherKey: descriptor
    })
  });

  assert.equal(tree.key(1).anotherKey, 'value');
});

test('allows to insert custom keys to objects', function(assert) {
  function buildObject(treeBuilder, target, key, value) {
    var childNode = {
      foo: 'generated property'
    };

    // Create child component
    Ceibo.defineProperty(target, key, childNode);

    // Recursion
    treeBuilder.processNode(value, childNode, target);
  }

  var tree = Ceibo.create(
    {
      key: { anotherKey: 'value' }
    },
    {
      builder: {
        object: buildObject
      }
    }
  );

  assert.equal(tree.foo, 'generated property');
  assert.equal(tree.key.anotherKey, 'value');
  assert.equal(tree.key.foo, 'generated property');
});

test('descriptors can access current tree by default', function(assert) {
  var tree = Ceibo.create({
    foo: {
      isDescriptor: true,

      get: function() {
        return 'The answer to life, the universe and everything is ' + this.bar;
      }
    },

    bar: {
      isDescriptor: true,

      value: 42
    }
  });

  assert.equal(
    tree.foo,
    'The answer to life, the universe and everything is 42'
  );
});

test('descriptors can mutate tree on build', function(assert) {
  var tree = Ceibo.create({
    foo: {
      isDescriptor: true,

      get: function() {
        return 'bar';
      },

      setup: function(target, keyName) {
        Ceibo.defineProperty(target, keyName.toUpperCase(), 'generated property');
      }
    }
  });

  assert.equal(tree.FOO, 'generated property');
});

test('.create asigns parent tree', function(assert) {
  var parentTree = Ceibo.create({ foo: { qux: 'another value' }, bar: 'a value' });
  var tree1 = Ceibo.create({ baz: {} }, { parent: parentTree });
  var tree2 = Ceibo.create({ baz: {} }, { parent: parentTree.foo });

  assert.equal(Ceibo.parent(Ceibo.parent(tree1.baz)).bar, 'a value');
  assert.equal(Ceibo.parent(tree2).qux, 'another value');
});

test(".create doesn't assigns a parent tree to the root", function(assert) {
  var tree = Ceibo.create({ foo: 'a value' });

  assert.ok(!Ceibo.parent(tree));
});

test(".parent returns undefined when node doesn't have parent or doesn't exists", function(assert) {
  var node = undefined;

  assert.ok(!Ceibo.parent(node));
});

test(".parent doesn't generates enumerable attribute", function(assert) {
  var tree = Ceibo.create({ foo: { bar: "a value" } });

  assert.equal(Object.keys(tree.foo).length, 1);
});

test("default builders are exposed", function(assert) {
  assert.expect(4);

  var expectedKeys = ["descriptor", "object", "default"];

  var defaults = Ceibo.defaults;

  assert.equal(typeof defaults.builder, "object");

  for (var i = 0; i < expectedKeys.length; i++) {
    assert.equal(typeof defaults.builder[expectedKeys[i]], "function");
  }
});
