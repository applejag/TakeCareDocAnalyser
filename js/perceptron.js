var Perceptron=(function () {
    var main = null;
    var modules = {
        "require": {
            factory: undefined,
            dependencies: [],
            exports: function (args, callback) { return require(args, callback); },
            resolved: true
        }
    };
    function define(id, dependencies, factory) {
        return main = modules[id] = {
            dependencies: dependencies,
            factory: factory,
            exports: {},
            resolved: false
        };
    }
    function resolve(definition) {
        if (definition.resolved === true)
            return;
        definition.resolved = true;
        var dependencies = definition.dependencies.map(function (id) {
            return (id === "exports")
                ? definition.exports
                : (function () {
                    if(modules[id] !== undefined) {
                      resolve(modules[id]);
                      return modules[id].exports;
                    } else {
                      try {
                        return require(id);
                      } catch(e) {
                        throw Error("module '" + id + "' not found.");
                      }
                    }
                })();
        });
        definition.factory.apply(null, dependencies);
    }
    function collect() {
        Object.keys(modules).map(function (key) { return modules[key]; }).forEach(resolve);
        return (main !== null) 
          ? main.exports
          : undefined
    }
  
    /*--------------------------------------------------------------------------
    
    neuron - neural network written in javascript.
    
    The MIT License (MIT)
    
    Copyright (c) 2017 Haydn Paterson (sinclair) <haydn.developer@gmail.com>
    
    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:
    
    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.
    
    ---------------------------------------------------------------------------*/
    define("matrix", ["require", "exports"], function (require, exports) {
        "use strict";
        exports.__esModule = true;
        /**
         * A matrix type used to express the weights between layers of a network.
         */
        var Matrix = /** @class */ (function () {
            /**
             * creates a new matrix with the given input and output dimensions (width and height)
             * @param {number} inputs the number of inputs.
             * @param {number} outputs the number of outputs.
             * @returns {Matrix}
             */
            function Matrix(inputs, outputs) {
                this.inputs = inputs;
                this.outputs = outputs;
                this.data = new Float64Array(this.inputs * this.outputs);
            }
            /**
             * gets a value within this matrix.
             * @param {number} i the input value
             * @param {number} o the output value.
             * @returns {number}
             */
            Matrix.prototype.get = function (i, o) {
                return this.data[i + (o * this.inputs)];
            };
            /**
             * sets a value within this matrix.
             * @param {number} i the input index.
             * @param {number} o the output index.
             * @param {number} value the value to set.
             */
            Matrix.prototype.set = function (i, o, value) {
                this.data[i + (o * this.inputs)] = value;
            };
            return Matrix;
        }());
        exports.Matrix = Matrix;
    });
    /*--------------------------------------------------------------------------
    
    neuron - neural network written in javascript.
    
    The MIT License (MIT)
    
    Copyright (c) 2017 Haydn Paterson (sinclair) <haydn.developer@gmail.com>
    
    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:
    
    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.
    
    ---------------------------------------------------------------------------*/
    define("tensor", ["require", "exports"], function (require, exports) {
        "use strict";
        exports.__esModule = true;
        /**
         * selects an activation function.
         * @param {string} type the type of activation.
         * @returns {Activation}
         */
        var select = function (type) {
            switch (type) {
                case "identity": return {
                    activate: function (x) { return x; },
                    derive: function (x) { return 1; }
                };
                case "tanh": return {
                    activate: function (x) { return (Math.exp(x) - Math.exp(-x)) / (Math.exp(x) + Math.exp(-x)); },
                    derive: function (x) { return (1 - (x * x)); }
                };
                case "binary-step": return {
                    activate: function (x) { return (x >= 0) ? 1 : 0; },
                    derive: function (x) { return (x >= 0) ? 1 : 0; }
                };
                case "relu": return {
                    activate: function (x) { return (x >= 0) ? x : 0; },
                    derive: function (x) { return (x >= 0) ? 1 : 0; }
                };
                default: throw Error("unknown activation");
            }
        };
        /** An n-dimensional vector used to represent a layer of a network.  */
        var Tensor = /** @class */ (function () {
            /**
             * creates a new tensor.
             * @param {number} units the number of units in this tensor (will result in +1 to include the bias)
             * @param {Activation} activation the activation functions to use. (defaults to "identity")
             * @param {number} bias the value of the tensors bias neuron (defaults to 1.0)
             * @returns {Tensor}
             */
            function Tensor(units, activation, bias) {
                if (activation === void 0) { activation = "identity"; }
                if (bias === void 0) { bias = 1.0; }
                this.data = new Float64Array(units + 1);
                this.data[this.data.length - 1] = bias;
                this.activation = select(activation);
            }
            return Tensor;
        }());
        exports.Tensor = Tensor;
    });
    /*--------------------------------------------------------------------------
    
    neuron - neural network written in javascript.
    
    The MIT License (MIT)
    
    Copyright (c) 2017 Haydn Paterson (sinclair) <haydn.developer@gmail.com>
    
    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:
    
    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.
    
    ---------------------------------------------------------------------------*/
    define("network", ["require", "exports", "matrix"], function (require, exports, matrix_1) {
        "use strict";
        exports.__esModule = true;
        var Network = /** @class */ (function () {
            /**
             * creates a new network with the given tensor layers.
             * @param {Tensor[]} tensors the tensors for each layer in the network.
             * @returns {Network}
             */
            function Network(tensors) {
                this.tensors = tensors;
                // initialize output buffer.
                this.output = new Array(this.tensors[this.tensors.length - 1].data.length - 1);
                // initialize network matrices.
                this.matrices = new Array(this.tensors.length - 1);
                for (var i = 0; i < this.tensors.length - 1; i++) {
                    this.matrices[i] = new matrix_1.Matrix(this.tensors[i + 0].data.length, this.tensors[i + 1].data.length - 1);
                }
                // initialize network compute kernels.
                this.kernels = new Array(this.matrices.length);
                for (var i = 0; i < this.kernels.length; i++) {
                    this.kernels[i] = {
                        input: this.tensors[i + 0],
                        output: this.tensors[i + 1],
                        matrix: this.matrices[i]
                    };
                }
            }
            /**
             * returns the memory footprint of this network in bytes.
             * @returns {number}
             */
            Network.prototype.memory = function () {
                var tensors = this.tensors.reduce(function (acc, t) { return acc + (t.data.byteLength); }, 0);
                var matrices = this.matrices.reduce(function (acc, m) { return acc + (m.data.byteLength); }, 0);
                return tensors + matrices;
            };
            /**
             * returns the number of inputs accepted by this network.
             * @returns {number}
             */
            Network.prototype.inputs = function () {
                return (this.tensors[0].data.length - 1);
            };
            /**
             * returns the number of outputs from this network.
             * @returns {number}
             */
            Network.prototype.outputs = function () {
                return (this.tensors[this.tensors.length - 1].data.length - 1);
            };
            /**
             * executes this network, propagating input to output.
             * @param {Array<number>} input the input buffer to write to the network.
             * @returns {Array<number>} the outputs for this network.
             */
            Network.prototype.forward = function (input) {
                // load data from input.
                for (var i = 0; i < input.length; i++) {
                    this.kernels[0].input.data[i] = input[i];
                }
                // feed forward values through the network.
                for (var k = 0; k < this.kernels.length; k++) {
                    var kernel = this.kernels[k];
                    for (var o = 0; o < kernel.matrix.outputs; o++) {
                        var sum = 0;
                        for (var i = 0; i < kernel.matrix.inputs; i++) {
                            sum += kernel.matrix.get(i, o) * kernel.input.data[i];
                        }
                        kernel.output.data[o] = kernel.output.activation.activate(sum);
                    }
                }
                // unload output layer return value.
                for (var o = 0; o < this.output.length; o++) {
                    this.output[o] = this.kernels[this.kernels.length - 1].output.data[o];
                }
                return this.output;
            };
            return Network;
        }());
        exports.Network = Network;
    });
    /*--------------------------------------------------------------------------
    
    neuron - neural network written in javascript.
    
    The MIT License (MIT)
    
    Copyright (c) 2017 Haydn Paterson (sinclair) <haydn.developer@gmail.com>
    
    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:
    
    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.
    
    ---------------------------------------------------------------------------*/
    define("random", ["require", "exports"], function (require, exports) {
        "use strict";
        exports.__esModule = true;
        /**
         * An simple implementation of a linear congruential generator.
         */
        var Random = /** @class */ (function () {
            /**
             * creates a new linear congruential generator.
             * @param {number} the initial seed value.
             * @returns {Random}
             */
            function Random(seed) {
                this.seed = seed;
                this.seed = this.seed === undefined ? 1 : this.seed;
                this.a = 1103515245;
                this.c = 12345;
                this.m = Math.pow(2, 31);
            }
            /**
             * returns a random number between 0.0 and 1.0
             * @returns {number}
             */
            Random.prototype.next = function () {
                this.seed = (this.a * this.seed + this.c) % this.m;
                return this.seed / this.m;
            };
            return Random;
        }());
        exports.Random = Random;
    });
    /*--------------------------------------------------------------------------
    
    neuron - neural network written in javascript.
    
    The MIT License (MIT)
    
    Copyright (c) 2017 Haydn Paterson (sinclair) <haydn.developer@gmail.com>
    
    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:
    
    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.
    
    ---------------------------------------------------------------------------*/
    define("trainer", ["require", "exports", "matrix", "random"], function (require, exports, matrix_2, random_1) {
        "use strict";
        exports.__esModule = true;
        /**
         * A network trainer that uses classic back propagation / gradient descent to
         * train a network. The class also proxies to the underlying network for
         * convenience.
         */
        var Trainer = /** @class */ (function () {
            /**
             * creates a new trainer.
             * @param {Network} network the network to train.
             * @param {number} step the network step size (defaults to 0.15)
             * @param {number} momentum the network momenum (defaults to 0.5)
             * @returns {Trainer}
             */
            function Trainer(network, options) {
                this.network = network;
                this.options = options;
                // initialize training options.
                this.options = this.options || {};
                this.options.seed = this.options.seed || 0;
                this.options.step = this.options.step || 0.15;
                this.options.momentum = this.options.momentum || 0.5;
                // initialize random.
                this.random = new random_1.Random(this.options.seed);
                // initialize matrix deltas
                this.deltas = new Array(this.network.matrices.length);
                for (var i = 0; i < this.network.matrices.length; i++) {
                    this.deltas[i] = new matrix_2.Matrix(this.network.matrices[i].inputs, this.network.matrices[i].outputs);
                }
                // initialize neuron gradients.
                this.gradients = new Array(this.network.tensors.length);
                for (var i = 0; i < this.network.tensors.length; i++) {
                    this.gradients[i] = new Float64Array(this.network.tensors[i].data.length);
                }
                // setup weight distribution (guassian)
                for (var m = 0; m < this.network.matrices.length; m++) {
                    for (var o = 0; o < this.network.matrices[m].outputs; o++) {
                        for (var i = 0; i < this.network.matrices[m].inputs; i++) {
                            var rand = (this.random.next() - 0.5) * (1 / Math.sqrt(this.network.matrices[m].inputs));
                            //const xavier = (Math.random() - 0.5) * (1/Math.sqrt(this.network.matrices[m].inputs * this.network.matrices[m].outputs))
                            this.network.matrices[m].set(i, o, rand);
                        }
                    }
                }
                // initialize compute kernels.
                this.kernels = new Array(this.network.kernels.length);
                for (var i = 0; i < this.network.kernels.length; i++) {
                    this.kernels[i] = {
                        matrix: {
                            matrix: this.network.matrices[i],
                            deltas: this.deltas[i]
                        },
                        input: {
                            tensor: this.network.tensors[i + 0],
                            grads: this.gradients[i + 0]
                        },
                        output: {
                            tensor: this.network.tensors[i + 1],
                            grads: this.gradients[i + 1]
                        }
                    };
                }
            }
            /**
             * (proxied) executes this network, propagating input to output.
             * @param {Array<number>} input the input buffer to write to the network.
             * @returns {Array<number>} the outputs for this network.
             */
            Trainer.prototype.forward = function (input) {
                return this.network.forward(input);
            };
            /**
             * computes the error for this network.
             * @param {Array<number>} input the network input.
             * @param {Array<number>} expect the expected output.
             * @returns {number} the error.
             */
            Trainer.prototype.error = function (input, expect) {
                var actual = this.network.forward(input);
                return Math.sqrt(actual.reduce(function (acc, value, index) {
                    var delta = (expect[index] - value);
                    return (acc + (delta * delta));
                }, 0) / actual.length);
            };
            /**
             * trains the network.
             * @param {Array<number>} input the network input.
             * @param {Array<number>} expect the expect output.
             * @returns {number} the network error for this sample.
             */
            Trainer.prototype.backward = function (input, expect) {
                // phase 0: execute the network, write to output layer.
                var actual = this.network.forward(input);
                // phase 1: calculate output layer gradients.
                var kernel = this.kernels[this.kernels.length - 1];
                for (var o = 0; o < kernel.matrix.matrix.outputs; o++) {
                    var delta = (expect[o] - kernel.output.tensor.data[o]);
                    kernel.output.grads[o] = (delta * kernel.output.tensor.activation.derive(kernel.output.tensor.data[o]));
                }
                // phase 2: calculate gradients on hidden layers.
                for (var k = this.kernels.length - 1; k > -1; k--) {
                    var kernel_1 = this.kernels[k];
                    for (var i = 0; i < kernel_1.matrix.matrix.inputs; i++) {
                        var delta = 0;
                        for (var o = 0; o < kernel_1.matrix.matrix.outputs; o++) {
                            delta += kernel_1.matrix.matrix.get(i, o) * kernel_1.output.grads[o];
                        }
                        kernel_1.input.grads[i] = (delta * kernel_1.input.tensor.activation.derive(kernel_1.input.tensor.data[i]));
                    }
                }
                // phase 3: gradient decent on the weights.
                for (var k = this.kernels.length - 1; k > -1; k--) {
                    var kernel_2 = this.kernels[k];
                    for (var i = 0; i < kernel_2.matrix.matrix.inputs; i++) {
                        for (var o = 0; o < kernel_2.matrix.matrix.outputs; o++) {
                            var old_delta = kernel_2.matrix.deltas.get(i, o);
                            var new_delta = (this.options.step * kernel_2.input.tensor.data[i] * kernel_2.output.grads[o]) + (this.options.momentum * old_delta);
                            var new_weight = kernel_2.matrix.matrix.get(i, o) + new_delta;
                            kernel_2.matrix.matrix.set(i, o, new_weight);
                            kernel_2.matrix.deltas.set(i, o, new_delta);
                        }
                    }
                }
                // phase 4: return the network error (before backprop)
                // note: to avoid an additional feed forward to compute
                // the error, we sample the 'actual' before backprop. This
                // means the error value returned is one step out with the 
                // training, this may not be acceptable. (for review)
                return Math.sqrt(actual.reduce(function (acc, value, index) {
                    var delta = (expect[index] - value);
                    return (acc + (delta * delta));
                }, 0) / actual.length);
            };
            return Trainer;
        }());
        exports.Trainer = Trainer;
    });
    /*--------------------------------------------------------------------------
    
    neuron - neural network written in javascript.
    
    The MIT License (MIT)
    
    Copyright (c) 2017 Haydn Paterson (sinclair) <haydn.developer@gmail.com>
    
    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:
    
    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.
    
    ---------------------------------------------------------------------------*/
    define("index", ["require", "exports", "network", "tensor", "trainer"], function (require, exports, network_1, tensor_1, trainer_1) {
        "use strict";
        exports.__esModule = true;
        exports.Network = network_1.Network;
        exports.Tensor = tensor_1.Tensor;
        exports.Trainer = trainer_1.Trainer;
    });
    
    return collect(); 
  })();