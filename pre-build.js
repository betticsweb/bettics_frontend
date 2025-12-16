var fs = require('fs');
var str = `
export const environment = {
    production: true,
    hmr: false,
    name: '${process.env.name}',
    urlIntegracion: '${process.env.urlIntegracion}',
};
`;
fs.writeFile("./src/environments/environment.prod.ts", str, function(err) {
    if (err) {
        return console.log(err);
    }
    console.log("The file was saved!");
});