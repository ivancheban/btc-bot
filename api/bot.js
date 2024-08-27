const { exec } = require('child_process');
const path = require('path');

exports.handler = function(event, context, callback) {
  const pythonScriptPath = path.join(__dirname, 'bot_handler.py');
  const python = path.join(__dirname, '.python_packages/lib/site-packages/python3.9');
  const pythonPath = process.env.PYTHONPATH ? `${process.env.PYTHONPATH}:${python}` : python;

  const env = Object.assign({}, process.env, { PYTHONPATH: pythonPath });

  exec(`python ${pythonScriptPath}`, { env }, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return callback(null, {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to execute Python script' })
      });
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ message: 'Python script executed successfully' })
    });
  });
};