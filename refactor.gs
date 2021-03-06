function ContestNotify() {
  const contests = [
    'AtCoder Beginner Contest',
    'AtCoder Regular Contest',
    'ACL Contest',
  ];
  for (let contest of contests) {
    Logger.log('check... '+contest);
    AtCoderNotify(contest);
  }
}

function AtCoderNotify(contestTitle) {
  let threads = GmailApp.search('from:noreply@atcoder.jp subject:'+contestTitle+" is:unread",0,1);
  if (threads.length === 0) return;
  mail = new AtCoderMail(threads[0]);
  notifier = new NotifyCalendar(mail, contestTitle);
  notifier.exec();
  threads[0].markRead();
}

NotifyCalendar = class {

  constructor(mail, pattern) {
    this.mail = mail;
    this.calendar = CalendarApp.getCalendarById(PropertiesService.getScriptProperties().getProperty('CALENDAR_ID'))
    this.pattern = pattern;
  }
  set() {
    // 既に登録済みなら終了
    let events = this.calendar.getEvents(this.mail.getStartDate(), this.mail.getEndDate());
    let regPattern = new RegExp(this.pattern,'i');
    for(var i=0; i<events.length; i++) {
      if (events[i].getTitle().match(regPattern)) return;
    }
    let options = { description:this.mail.getUrl() };
    let event = this.calendar.createEvent(
      this.mail.getContestName(),
      this.mail.getStartDate(),
      this.mail.getEndDate(),
      options
    );
    Logger.log(
      this.mail.getContestName()+"\n"+"start:"+this.mail.getStartDate()+"\n"+"end:"+this.mail.getEndDate()+"\n"
    );
    event.addPopupReminder(60);
    event.addPopupReminder(5);
    Logger.log('Event ID: ' + event.getId());
    this.mail.thread.markRead();
  }
  exec() {
    let date = new Date(Date.now());
    let day = date.getDay();
    // 土日以外は実行しない
    if (!(day === 0 | day === 6)) return;
    if (date.getHours() >= 12) {
      this.set();
    }
  }
} 

AtCoderMail = class {

  constructor(thread) {
    this.thread = thread
    this.message = this.thread.getMessages()[0]
    this.body = this.message.getBody()
  }
  getUrl() {
    let url_reg = new RegExp('コンテストページ： '+ '.*?' + '\r');
    let url = this.body.match(url_reg)[0].replace('コンテストページ： ','');
    return url;
  }
  getPeriod() {
    let period_reg = new RegExp('コンテスト時間：'+'.*?' + '\r');
    let period = this.body.match(period_reg)[0].replace('コンテスト時間：','').replace('分','');
    return period;
  }
  getContestName() {
    let subject = this.message.getSubject();
    subject = subject.replace('告知','');
    return subject;
  }
  getStartDate() {
    let start_date_reg = new RegExp('開始時刻： '+ '.*?' + '\r');
    let start_dates = this.body.match(start_date_reg)[0].replace('開始時刻： ','').replace(/\(.*?\) /g,',').split(',');
    return new Date(start_dates[0]+' '+start_dates[1]);
  }
  getEndDate() {
    return new Date(this.getStartDate().getTime()+this.getPeriod()*60*1000);
  }
}
