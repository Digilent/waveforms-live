var exec = require('child_process').exec;
var cmd = 'node versionManager.js ' + process.argv[2];

exec('node versionManager.js ' + process.argv[2], function (error, stdout, stderr) {
    // command output is in stdout
    if (error) { throw error }
    else {
        console.log(stdout);
        console.log('Building Browser');
        exec('ionic build browser --prod', (error, stdout, stderr) => {
            if (error) {
                console.log(stderr);
                throw error;
            }
            else {
                console.log(stdout);
            }
        });
    }
});