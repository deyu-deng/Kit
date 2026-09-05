/* cronGenerator.js - Visual Cron Expression Builder and Natural Language Explainer */

export function initCronGeneratorTool() {
  const fields = {
    min: { input: document.getElementById('cron-min'), val: document.getElementById('cron-min-val') },
    hour: { input: document.getElementById('cron-hour'), val: document.getElementById('cron-hour-val') },
    day: { input: document.getElementById('cron-day'), val: document.getElementById('cron-day-val') },
    month: { input: document.getElementById('cron-month'), val: document.getElementById('cron-month-val') },
    week: { input: document.getElementById('cron-week'), val: document.getElementById('cron-week-val') }
  };

  const outputExp = document.getElementById('cron-output-expression');
  const translationDiv = document.getElementById('cron-readable-translation');
  const btnCopy = document.getElementById('cron-copy-btn');
  const elAlert = document.getElementById('cron-alert');

  if (!fields.min.input || !outputExp || !translationDiv) return;

  function updateCron() {
    // Sanitize inputs slightly (allow numbers, *, /, -, ,)
    const cronValues = {
      min: sanitizeField(fields.min.input.value, '*'),
      hour: sanitizeField(fields.hour.value ? fields.hour.value : fields.hour.input.value, '*'),
      day: sanitizeField(fields.day.value ? fields.day.value : fields.day.input.value, '*'),
      month: sanitizeField(fields.month.value ? fields.month.value : fields.month.input.value, '*'),
      week: sanitizeField(fields.week.value ? fields.week.value : fields.week.input.value, '*')
    };

    // Update labels
    fields.min.val.textContent = cronValues.min;
    fields.hour.val.textContent = cronValues.hour;
    fields.day.val.textContent = cronValues.day;
    fields.month.val.textContent = cronValues.month;
    fields.week.val.textContent = cronValues.week;

    // Compile cron expression
    const cronExpression = `${cronValues.min} ${cronValues.hour} ${cronValues.day} ${cronValues.month} ${cronValues.week}`;
    outputExp.value = cronExpression;

    // Generate Natural Language Translation
    const readableText = translateCron(cronValues);
    translationDiv.innerHTML = readableText;
  }

  function sanitizeField(val, defaultVal) {
    const clean = val.trim().replace(/[^0-9*/,\-]/g, '');
    return clean === '' ? defaultVal : clean;
  }

  function translateCron(c) {
    const isEn = (localStorage.getItem('app-lang') || 'en') === 'en';
    
    // Day names mapping
    const dayNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayNamesCn = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    
    // Month names mapping
    const monthNamesEn = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthNamesCn = ['', '一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

    let translation = '';
    let cnTranslation = '';

    // 1. Resolve Minutes & Hours
    if (c.min === '*' && c.hour === '*') {
      translation += 'Every minute ';
      cnTranslation += '每分钟';
    } else if (c.min.startsWith('*/') && c.hour === '*') {
      const step = c.min.split('*/')[1];
      translation += `Every ${step} minutes `;
      cnTranslation += `每隔 ${step} 分钟`;
    } else {
      const formatMin = c.min === '*' ? 'every minute' : `minute ${c.min}`;
      const formatMinCn = c.min === '*' ? '每分钟' : `${c.min}分`;
      
      if (c.hour === '*') {
        translation += `At ${formatMin} of every hour `;
        cnTranslation += `在每小时的第 ${formatMinCn} `;
      } else if (c.hour.includes(',') || c.hour.includes('-') || c.hour.startsWith('*/')) {
        translation += `At ${formatMin} of hours (${c.hour}) `;
        cnTranslation += `在第 ${c.hour} 小时的第 ${formatMinCn} `;
      } else {
        // Single hour value (e.g. 12)
        const hourInt = parseInt(c.hour);
        const ampm = hourInt >= 12 ? 'PM' : 'AM';
        const displayHour = hourInt % 12 === 0 ? 12 : hourInt % 12;
        const displayMin = c.min === '*' ? '00' : c.min.padStart(2, '0');
        
        if (c.min === '*') {
          translation += `Every minute of hour ${c.hour} `;
          cnTranslation += `在 ${c.hour} 点的每分钟 `;
        } else {
          translation += `At ${displayHour}:${displayMin} ${ampm} `;
          cnTranslation += `在每天的 ${c.hour} 点 ${c.min} 分 `;
        }
      }
    }

    // 2. Resolve Days / Weekdays
    if (c.day === '*' && c.week === '*') {
      translation += 'every day ';
      cnTranslation += '每一天';
    } else {
      // Days of month
      if (c.day !== '*') {
        translation += `on day ${c.day} of the month `;
        cnTranslation += `在每月第 ${c.day} 天 `;
      }
      
      // Days of week
      if (c.week !== '*') {
        let weekdayStr = '';
        let weekdayStrCn = '';
        if (c.week.includes(',')) {
          const parts = c.week.split(',');
          weekdayStr = parts.map(p => dayNamesEn[p] || p).join(', ');
          weekdayStrCn = parts.map(p => dayNamesCn[p] || p).join('、');
        } else if (c.week.includes('-')) {
          const parts = c.week.split('-');
          weekdayStr = `${dayNamesEn[parts[0]] || parts[0]} through ${dayNamesEn[parts[1]] || parts[1]}`;
          weekdayStrCn = `${dayNamesCn[parts[0]] || parts[0]} 到 ${dayNamesCn[parts[1]] || parts[1]}`;
        } else {
          weekdayStr = dayNamesEn[c.week] || c.week;
          weekdayStrCn = dayNamesCn[c.week] || c.week;
        }
        
        if (c.day !== '*') {
          translation += `and on ${weekdayStr} `;
          cnTranslation += `以及在 ${weekdayStrCn} `;
        } else {
          translation += `on ${weekdayStr} `;
          cnTranslation += `在每个 ${weekdayStrCn} `;
        }
      }
    }

    // 3. Resolve Months
    if (c.month !== '*') {
      let monthStr = '';
      let monthStrCn = '';
      if (c.month.includes(',')) {
        const parts = c.month.split(',');
        monthStr = parts.map(p => monthNamesEn[p] || p).join(', ');
        monthStrCn = parts.map(p => monthNamesCn[p] || p).join('、');
      } else {
        monthStr = monthNamesEn[c.month] || c.month;
        monthStrCn = monthNamesCn[c.month] || c.month;
      }
      translation += `in ${monthStr}`;
      cnTranslation += `（仅在 ${monthStrCn} 执行）`;
    }

    // Return current language
    return isEn ? translation.trim() + '.' : cnTranslation.trim() + '。';
  }

  // Bind input listeners
  const inputList = [fields.min.input, fields.hour.input, fields.day.input, fields.month.input, fields.week.input];
  inputList.forEach(input => {
    input.addEventListener('input', updateCron);
  });

  // Watch for language change to update translation output dynamically
  const btnLang = document.getElementById('lang-btn');
  if (btnLang) {
    btnLang.addEventListener('click', () => {
      // Delay slightly to wait for localStorage to update in app.js
      setTimeout(updateCron, 100);
    });
  }

  // Copy Event
  btnCopy.addEventListener('click', () => {
    if (!outputExp.value) return;
    navigator.clipboard.writeText(outputExp.value).then(() => {
      elAlert.style.display = 'block';
      setTimeout(() => {
        elAlert.style.display = 'none';
      }, 2000);
    });
  });

  // Initial update
  updateCron();
}
