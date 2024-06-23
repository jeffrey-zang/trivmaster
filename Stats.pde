class Stats {
  int correct;
  int wrong;
  int timeout;

  Stats() {}

  void fetch() {
    String[] statsData = loadStrings("data/stats.txt");

    this.correct = int(statsData[0]);
    this.wrong = int(statsData[1]);
    this.timeout = int(statsData[2]);
  }

  void save() {
    String[] statsData = new String[3];

    println(this.correct, this.wrong, this.timeout);
    statsData[0] = str(this.correct);
    statsData[1] = str(this.wrong);
    statsData[2] = str(this.timeout);

    saveStrings("data/stats.txt", statsData);
  }

  void correct() {
    this.correct++;
    this.save();
  }
  void wrong() {
    this.wrong++;
    this.save();
  }
  void timeout() {
    this.timeout++;
    this.save();
  }

  int getTotal() {
    return this.correct + this.wrong + this.timeout;
  }
  float getPercentage() {
    if (this.getTotal() == 0) {
      return 0;
    }
    return int((float(this.correct) / float(this.getTotal())) * 100);
  }
}