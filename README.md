# WaveForms Live

WaveForms Live is Digilent's open source browser based instrumentation software. WaveForms Live provides a cross-platform way to control instrumentation hardware including an Oscilloscope, Logic Analyzer, GPIO, Power Supply and more. WaveForms Live currently only supports the [OpenScope MZ](https://reference.digilentinc.com/reference/instrumentation/openscope-mz/start).

![Instrument Panel Overview](/docs/assets/instrument-panel-overview.png)

### For Users:

WaveForms Live can be accessed online at: [http://waveformslive.com/](http://waveformslive.com/)

There is a guide to help you get started at: [https://reference.digilentinc.com/reference/software/waveforms-live/start](https://reference.digilentinc.com/reference/software/waveforms-live/start)

### For Developers:

WaveForms Live is a cross platform browser based app built using the [Ionic Framework v2](https://ionicframework.com/). WaveForms Live (and the OpenScope MZ hardware instrumentation) is open source, licensed under the MIT License.

#### Local Development:

Ionic2 requires `Node > 6.0` and `NPM > 3.0`. Our team uses `Node v6.11.0` and `NPM v3.10.10`

#### Developer Quick Start

```
# Install Ionic and Cordova globally
npm install -g ionic@2.2.2
npm install -g cordova

# Clone this repository
git clone https://github.com/Digilent/waveforms-live.git
cd waveforms-live

# Install the application dependencies
npm install

# Test in local browser
ionic serve
```