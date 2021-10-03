export function toMessages (entry) {
  return chunk(entry.tasks, 25).map((tasks, index) => ({
    content: index === 0 ? entry.label : '...',
    components: chunkEven(tasks, 5).map(row)
  }));
}

export function toMessage ({ label, tasks }) {
  return {
    content: label,
    components: chunkEven(tasks, 5).map(row)
  };
}

export function fromMessage (message) {
  const entry = {
    label: message.content,
    schedule: null,
    tasks: []
  };

  for (let row of message.components) {
    for (let { label, customId, style } of row.components) {
      entry.tasks.push({
        label,
        id: parseInt(customId.match(/\d+/)[0]),
        state: styleToState[style] || 0
      });
    }
  }

  return entry;
}

export function incrementTask (entry, customId) {
  const index = parseInt(customId.match(/\d+/)[0]);  
  const task = entry.tasks[index];
  task.state = (task.state + 1) % 4;
}

const stateToStyle = [2, 3, 1, 4];

const styleToState = {
  'SECONDARY': 0,
  'SUCCESS': 1,
  'PRIMARY': 2,
  'DANGER': 3
};

function row (tasks) {
  return {
    type: 1,
    components: tasks.map(button)
  };
}

function button ({ label, id, state }) {
  return {
    type: 2,
    label,
    style: stateToStyle[state],
    custom_id: `task_toggle_${id}`
  };
}

function chunk (array, max) {
  const rows = [];

  for (let i = 0; i < array.length; i++) {
    if (i % max === 0) {
      rows.push([]);
    }

    rows[Math.floor(i / max)].push(array[i]);
  }

  return rows;
}

function chunkEven (array, max) {
  const numRows = Math.ceil(array.length/max);
  const perRow = Math.ceil(array.length/numRows);

  return chunk(array, perRow);
}
