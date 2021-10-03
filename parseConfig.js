import cron from 'node-cron';

export default function parseConfig (config) {
  const entries = [];
  var entry = undefined;

  for (var line of config.split('\n')) {
    line = line.trim();

    if (line.startsWith('#')) {
      if (entry && entry.tasks.length > 0) {
        entries.push(entry);
      }
      const header = line.match(/#\s*(.*[^\s])\s*@\s*(.*)/);
      
      if (!header) {
        throw `Config error: invalid section header ("${line}")`;
      }

      const [, label, schedule] = header;
      if (!cron.validate(schedule)) {
        throw `Config error: invalid schedule format ("${schedule}")`;
      }
      entry = { label, schedule, tasks: [] };

    } else if (line !== '' && !line.startsWith('```')) {
      if (!entry) {
        throw "Config error: configuration must begin with a section header";
      }

      entry.tasks.push({
        label: line,
        state: 0,
        id: entry.tasks.length % 25
      });
    }
  }

  if (entry) {
    entries.push(entry);
  }

  return entries;
}