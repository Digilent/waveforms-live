var mathFunctions = (function () {

    /**************************************************
    * Function Definitions
    **************************************************/
    var getMax = function getMax(chartRef, seriesNum, minIndex, maxIndex) {
        //Spread operator '...' uses each index as the corresponding parameter in the function
        var series = chartRef.getData();
        var getAxes = chartRef.getAxes();
        var yIndexer = 'y' + (seriesNum === 0 ? '' : (seriesNum + 1).toString()) + 'axis';
        var activeIndices = series[seriesNum].data.slice(minIndex, maxIndex);
        var yArray = activeIndices.map(function (element) {
            return element[1];
        });
        var value = Math.max(...yArray);
        return value;
    }

    var getMin = function getMin(chartRef, seriesNum, minIndex, maxIndex) {
        var series = chartRef.getData();
        var getAxes = chartRef.getAxes();
        var yIndexer = 'y' + (seriesNum === 0 ? '' : (seriesNum + 1).toString()) + 'axis';
        var activeIndices = series[seriesNum].data.slice(minIndex, maxIndex);
        var yArray = activeIndices.map(function (element) {
            return element[1];
        });
        var value = Math.min(...yArray);
        return value;
    }

    var getLocalMax = function getLocalMax(chartRef, seriesNum, minIndex, maxIndex) {
        var maxCoordinates = [];
        var detector = true;
        for (var i = minIndex; i < maxIndex - 1; i++) {
            if (this.chart.series[seriesNum].yData[i] - this.chart.series[seriesNum].yData[i + 1] >= 0 && !detector) {
                maxCoordinates.push({
                    x: this.chart.series[seriesNum].xData[i],
                    y: this.chart.series[seriesNum].yData[i]
                });
                detector = true;
            }
            if (this.chart.series[seriesNum].yData[i] - this.chart.series[seriesNum].yData[i + 1] < 0 && detector) {
                detector = false;
            }
        }
    }

    var getLocalMin = function getLocalMin(chartRef, seriesNum, minIndex, maxIndex) {
        var minCoordinates = [];
        var detector = true;
        for (var i = minIndex; i < maxIndex - 1; i++) {
            if (this.chart.series[seriesNum].yData[i] - this.chart.series[seriesNum].yData[i + 1] < 0 && !detector) {
                minCoordinates.push({
                    x: this.chart.series[seriesNum].xData[i],
                    y: this.chart.series[seriesNum].yData[i]
                });
                detector = true;
            }
            if (this.chart.series[seriesNum].yData[i] - this.chart.series[seriesNum].yData[i + 1] >= 0 && detector) {
                detector = false;
            }
        }
    }

    var getAmplitude = function getAmplitude(chartRef, seriesNum, minIndex, maxIndex, rawDataArray) {
        var activeIndices;
        var sampleFreq;
        if (rawDataArray == undefined) {
            var series = chartRef.getData();
            var getAxes = chartRef.getAxes();
            var yIndexer = 'y' + (seriesNum === 0 ? '' : (seriesNum + 1).toString()) + 'axis';
            minIndex = 0;
            maxIndex = series[seriesNum].data.length - 1;
            activeIndices = series[seriesNum].data.slice(minIndex, maxIndex);
            sampleFreq = 1 / (series[seriesNum].data[1][0] - series[seriesNum].data[0][0]);
        }
        else {
            minIndex = 0;
            maxIndex = rawDataArray.length - 1;
            activeIndices = rawDataArray;
            sampleFreq = 1 / (rawDataArray[1][0] - rawDataArray[0][0]);
        }
        var real = activeIndices.map(function (element) {
            return element[1];
        });
        var imaginary = new Array(real.length).fill(0);
        var numSamples = real.length;
        transformBluestein(real, imaginary);
        var startingIndex = 1;
        var indexMax = startingIndex;
        var maxMag = Math.sqrt(Math.pow(real[startingIndex], 2) + Math.pow(imaginary[startingIndex], 2));
        for (var i = startingIndex + 1; i < real.length / 2; i++) {
            var magnitude = Math.sqrt(Math.pow(real[i], 2) + Math.pow(imaginary[i], 2));
            if (magnitude > maxMag) {
                maxMag = magnitude;
                indexMax = i;
            }
        }
        var amplitude = maxMag / numSamples * 2;

        return amplitude;
    }

    var getMean = function getMean(chartRef, seriesNum, minIndex, maxIndex) {
        var sum = 0;
        var series = chartRef.getData();
        var getAxes = chartRef.getAxes();
        var yIndexer = 'y' + (seriesNum === 0 ? '' : (seriesNum + 1).toString()) + 'axis';
        var activeIndices = series[seriesNum].data.slice(minIndex, maxIndex);
        var yArray = activeIndices.map(function (element) {
            return element[1];
        });
        for (var i = 0; i < yArray.length; i++) {
            sum += yArray[i];
        }
        var value = sum / (maxIndex - minIndex);
        return value;
    }

    var getRMS = function getRMS(chartRef, seriesNum, minIndex, maxIndex) {
        var sum = 0;
        var series = chartRef.getData();
        var getAxes = chartRef.getAxes();
        var yIndexer = 'y' + (seriesNum === 0 ? '' : (seriesNum + 1).toString()) + 'axis';
        var activeIndices = series[seriesNum].data.slice(minIndex, maxIndex);
        var yArray = activeIndices.map(function (element) {
            return element[1];
        });
        for (var i = 0; i < yArray.length; i++) {
            sum += Math.pow(yArray[i], 2);
        }
        var value = Math.sqrt(sum / (maxIndex - minIndex));
        return value;
    }

    var getPeakToPeak = function getPeakToPeak(chartRef, seriesNum, minIndex, maxIndex) {
        var max = getMax(chartRef, seriesNum, minIndex, maxIndex);
        var min = getMin(chartRef, seriesNum, minIndex, maxIndex);
        var p2p = parseFloat(max) - parseFloat(min);

        return p2p;
    }

    var getFftArray = function getFftArray(chartRef, seriesNum, minIndex, maxIndex) {
        var series = chartRef.getData();
        var getAxes = chartRef.getAxes();
        var yIndexer = 'y' + (seriesNum === 0 ? '' : (seriesNum + 1).toString()) + 'axis';
        var activeIndices = series[seriesNum].data.slice(minIndex, maxIndex);
        var real = activeIndices.map(function (element) {
            return element[1];
        });
        var sampleFreq = 1 / (series[seriesNum].data[1][0] - series[seriesNum].data[0][0]);
        var imaginary = new Array(real.length).fill(0);
        var numSamples = real.length;
        transformBluestein(real, imaginary);
        var magnitudeFreqArray = [];
        var step = sampleFreq / numSamples;
        for (var i = 0; i < real.length / 2; i++) {
            var magnitude = Math.sqrt(Math.pow(real[i], 2) + Math.pow(imaginary[i], 2));
            if (i === 0) {
                magnitudeFreqArray.push([step * i, (magnitude / numSamples)]);
            }
            else {
                magnitudeFreqArray.push([step * i, (magnitude / numSamples) * 2]);
            }
        }
        return magnitudeFreqArray;
    }

    var getFrequency = function getFrequency(chartRef, seriesNum, minIndex, maxIndex, rawDataArray) {
        var activeIndices;
        var sampleFreq;
        if (rawDataArray == undefined) {
            var series = chartRef.getData();
            var getAxes = chartRef.getAxes();
            var yIndexer = 'y' + (seriesNum === 0 ? '' : (seriesNum + 1).toString()) + 'axis';
            minIndex = 0;
            maxIndex = series[seriesNum].data.length - 1;
            activeIndices = series[seriesNum].data.slice(minIndex, maxIndex);
            sampleFreq = 1 / (series[seriesNum].data[1][0] - series[seriesNum].data[0][0]);
        }
        else {
            minIndex = 0;
            maxIndex = rawDataArray.length - 1;
            activeIndices = rawDataArray;
            sampleFreq = 1 / (rawDataArray[1][0] - rawDataArray[0][0]);
        }
        var real = activeIndices.map(function(element) {
            return element[1];
        });
        var imaginary = new Array(real.length).fill(0);
        var numSamples = real.length;
        transformBluestein(real, imaginary);
        //Ignore 0 frequency part when trying to get frequency. Offset can be bigger than wave amplitude and cause issues.
        var startingIndex = 1;
        var maxMag = Math.sqrt(Math.pow(real[startingIndex], 2) + Math.pow(imaginary[startingIndex], 2));
        var indexMax = 0;
        for (var i = startingIndex + 1; i < real.length / 2; i++) {
            var magnitude = Math.sqrt(Math.pow(real[i], 2) + Math.pow(imaginary[i], 2));
            if (magnitude > maxMag) {
                maxMag = magnitude;
                indexMax = i;
            }
        }
        var step = sampleFreq / numSamples;
        var frequency = indexMax * step;
        return frequency;
    }

    var getPeriod = function getPeriod(chartRef, seriesNum, minIndex, maxIndex) {
        var series = chartRef.getData();
        var getAxes = chartRef.getAxes();
        var yIndexer = 'y' + (seriesNum === 0 ? '' : (seriesNum + 1).toString()) + 'axis';
        //get full buffer
        minIndex = 0;
        maxIndex = series[seriesNum].data.length - 1;
        var activeIndices = series[seriesNum].data.slice(minIndex, maxIndex);
        var real = activeIndices.map(function (element) {
            return element[1];
        });
        var sampleFreq = 1 / (series[seriesNum].data[1][0] - series[seriesNum].data[0][0]);
        var imaginary = new Array(real.length).fill(0);
        var numSamples = real.length;
        transformBluestein(real, imaginary);
        var startingIndex = 1;
        var indexMax = startingIndex;
        var maxMag = Math.sqrt(Math.pow(real[startingIndex], 2) + Math.pow(imaginary[startingIndex], 2));
        for (var i = startingIndex + 1; i < real.length / 2; i++) {
            var magnitude = Math.sqrt(Math.pow(real[i], 2) + Math.pow(imaginary[i], 2));
            if (magnitude > maxMag) {
                maxMag = magnitude;
                indexMax = i;
            }
        }
        var step = sampleFreq / numSamples;
        var frequency = indexMax * step;
        return (1 / frequency);
    }

    /**************************************************
    * Private Functions
    **************************************************/
    /* 
    * Free FFT and convolution (JavaScript)
    * 
    * Copyright (c) 2014 Project Nayuki
    * https://www.nayuki.io/page/free-small-fft-in-multiple-languages
    * 
    * (MIT License)
    * Permission is hereby granted, free of charge, to any person obtaining a copy of
    * this software and associated documentation files (the "Software"), to deal in
    * the Software without restriction, including without limitation the rights to
    * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
    * the Software, and to permit persons to whom the Software is furnished to do so,
    * subject to the following conditions:
    * - The above copyright notice and this permission notice shall be included in
    *   all copies or substantial portions of the Software.
    * - The Software is provided "as is", without warranty of any kind, express or
    *   implied, including but not limited to the warranties of merchantability,
    *   fitness for a particular purpose and noninfringement. In no event shall the
    *   authors or copyright holders be liable for any claim, damages or other
    *   liability, whether in an action of contract, tort or otherwise, arising from,
    *   out of or in connection with the Software or the use or other dealings in the
    *   Software.
    * 
    */

    /* 
     * Computes the discrete Fourier transform (DFT) of the given complex vector, storing the result back into the vector.
     * The vector can have any length. This is a wrapper function.
     */
    function transform(real, imag) {
        if (real.length != imag.length)
            throw "Mismatched lengths";

        var n = real.length;
        if (n == 0)
            return;
        else if ((n & (n - 1)) == 0)  // Is power of 2
            transformRadix2(real, imag);
        else  // More complicated algorithm for arbitrary sizes
            transformBluestein(real, imag);
    }
    /* 
 * Computes the inverse discrete Fourier transform (IDFT) of the given complex vector, storing the result back into the vector.
 * The vector can have any length. This is a wrapper function. This transform does not perform scaling, so the inverse is not a true inverse.
 */
    function inverseTransform(real, imag) {
        transform(imag, real);
    }


    /* 
     * Computes the discrete Fourier transform (DFT) of the given complex vector, storing the result back into the vector.
     * The vector's length must be a power of 2. Uses the Cooley-Tukey decimation-in-time radix-2 algorithm.
     */
    function transformRadix2(real, imag) {
        // Initialization
        if (real.length != imag.length)
            throw "Mismatched lengths";
        var n = real.length;
        if (n == 1)  // Trivial transform
            return;
        var levels = -1;
        for (var i = 0; i < 32; i++) {
            if (1 << i == n)
                levels = i;  // Equal to log2(n)
        }
        if (levels == -1)
            throw "Length is not a power of 2";
        var cosTable = new Array(n / 2);
        var sinTable = new Array(n / 2);
        for (var i = 0; i < n / 2; i++) {
            cosTable[i] = Math.cos(2 * Math.PI * i / n);
            sinTable[i] = Math.sin(2 * Math.PI * i / n);
        }

        // Bit-reversed addressing permutation
        for (var i = 0; i < n; i++) {
            var j = reverseBits(i, levels);
            if (j > i) {
                var temp = real[i];
                real[i] = real[j];
                real[j] = temp;
                temp = imag[i];
                imag[i] = imag[j];
                imag[j] = temp;
            }
        }

        // Cooley-Tukey decimation-in-time radix-2 FFT
        for (var size = 2; size <= n; size *= 2) {
            var halfsize = size / 2;
            var tablestep = n / size;
            for (var i = 0; i < n; i += size) {
                for (var j = i, k = 0; j < i + halfsize; j++ , k += tablestep) {
                    var tpre = real[j + halfsize] * cosTable[k] + imag[j + halfsize] * sinTable[k];
                    var tpim = -real[j + halfsize] * sinTable[k] + imag[j + halfsize] * cosTable[k];
                    real[j + halfsize] = real[j] - tpre;
                    imag[j + halfsize] = imag[j] - tpim;
                    real[j] += tpre;
                    imag[j] += tpim;
                }
            }
        }

        // Returns the integer whose value is the reverse of the lowest 'bits' bits of the integer 'x'.
        function reverseBits(x, bits) {
            var y = 0;
            for (var i = 0; i < bits; i++) {
                y = (y << 1) | (x & 1);
                x >>>= 1;
            }
            return y;
        }
    }


    /* 
     * Computes the discrete Fourier transform (DFT) of the given complex vector, storing the result back into the vector.
     * The vector can have any length. This requires the convolution function, which in turn requires the radix-2 FFT function.
     * Uses Bluestein's chirp z-transform algorithm.
     */
    function transformBluestein(real, imag) {
        // Find a power-of-2 convolution length m such that m >= n * 2 + 1
        if (real.length != imag.length)
            throw "Mismatched lengths";
        var n = real.length;
        var m = 1;
        while (m < n * 2 + 1)
            m *= 2;

        // Trignometric tables
        var cosTable = new Array(n);
        var sinTable = new Array(n);
        for (var i = 0; i < n; i++) {
            var j = i * i % (n * 2);  // This is more accurate than j = i * i
            cosTable[i] = Math.cos(Math.PI * j / n);
            sinTable[i] = Math.sin(Math.PI * j / n);
        }

        // Temporary vectors and preprocessing
        var areal = new Array(m);
        var aimag = new Array(m);
        for (var i = 0; i < n; i++) {
            areal[i] = real[i] * cosTable[i] + imag[i] * sinTable[i];
            aimag[i] = -real[i] * sinTable[i] + imag[i] * cosTable[i];
        }
        for (var i = n; i < m; i++)
            areal[i] = aimag[i] = 0;
        var breal = new Array(m);
        var bimag = new Array(m);
        breal[0] = cosTable[0];
        bimag[0] = sinTable[0];
        for (var i = 1; i < n; i++) {
            breal[i] = breal[m - i] = cosTable[i];
            bimag[i] = bimag[m - i] = sinTable[i];
        }
        for (var i = n; i <= m - n; i++)
            breal[i] = bimag[i] = 0;

        // Convolution
        var creal = new Array(m);
        var cimag = new Array(m);
        convolveComplex(areal, aimag, breal, bimag, creal, cimag);

        // Postprocessing
        for (var i = 0; i < n; i++) {
            real[i] = creal[i] * cosTable[i] + cimag[i] * sinTable[i];
            imag[i] = -creal[i] * sinTable[i] + cimag[i] * cosTable[i];
        }
    }


    /* 
     * Computes the circular convolution of the given real vectors. Each vector's length must be the same.
     */
    function convolveReal(x, y, out) {
        if (x.length != y.length || x.length != out.length)
            throw "Mismatched lengths";
        var zeros = new Array(x.length);
        for (var i = 0; i < zeros.length; i++)
            zeros[i] = 0;
        convolveComplex(x, zeros, y, zeros.slice(), out, zeros.slice());
    }


    /* 
     * Computes the circular convolution of the given complex vectors. Each vector's length must be the same.
     */
    function convolveComplex(xreal, ximag, yreal, yimag, outreal, outimag) {
        if (xreal.length != ximag.length || xreal.length != yreal.length || yreal.length != yimag.length || xreal.length != outreal.length || outreal.length != outimag.length)
            throw "Mismatched lengths";

        var n = xreal.length;
        xreal = xreal.slice();
        ximag = ximag.slice();
        yreal = yreal.slice();
        yimag = yimag.slice();

        transform(xreal, ximag);
        transform(yreal, yimag);
        for (var i = 0; i < n; i++) {
            var temp = xreal[i] * yreal[i] - ximag[i] * yimag[i];
            ximag[i] = ximag[i] * yreal[i] + xreal[i] * yimag[i];
            xreal[i] = temp;
        }
        inverseTransform(xreal, ximag);
        for (var i = 0; i < n; i++) {  // Scaling (because this FFT implementation omits it)
            outreal[i] = xreal[i] / n;
            outimag[i] = ximag[i] / n;
        }
    }

    /**************************************************
    * Return Functions
    **************************************************/
    return {
        getMax: getMax,
        getMin: getMin,
        getLocalMax: getLocalMax,
        getLocalMin: getLocalMin,
        getAmplitude: getAmplitude,
        getMean: getMean,
        getRMS: getRMS,
        getPeakToPeak: getPeakToPeak,
        getFrequency: getFrequency,
        getPeriod: getPeriod,
        getFftArray: getFftArray
    }

})()