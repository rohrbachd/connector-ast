import { Command } from 'commander';
const program = new Command();
program
    .name('connector-cli')
    .description('CLI for the Lightweight Dataspace Connector')
    .version('1.0.0');
program
    .command('start')
    .description('Start the connector services')
    .action(() => {
    console.info('Starting connector services...');
});
program
    .command('migrate')
    .description('Run database migrations')
    .action(() => {
    console.info('Running database migrations...');
});
program.parse(process.argv);
//# sourceMappingURL=index.js.map