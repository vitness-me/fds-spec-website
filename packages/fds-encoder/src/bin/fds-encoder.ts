#!/usr/bin/env node
import { main, onOutputError } from '../cli';

process.stdout.on('error', onOutputError((code) => process.exit(code)));
main(process.argv.slice(2)).then((code) => { process.exitCode = code; });
