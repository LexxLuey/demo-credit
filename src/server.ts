import chalk from 'chalk';
import app from './app';
import { config } from './config/env.config';

try {
    app.listen(config.port, () => {
        console.log(chalk.green.bold(`🚀🚀🚀 Server is running on port ${config.port}`));
    });    
} catch (error) {
    console.log(chalk.red.bold(`😵 Server failed to start with error: ${error}`));
}
