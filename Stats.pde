class Stats {
  int correct;
  int wrong;
  int timeout;
  
  Stats() {} // initialize with nothing because file readings cannot happen before setup()
  
  void fetch() { // Load stats from file
    String[] statsData = loadStrings("data/stats.txt");
    
    this.correct = int(statsData[0]);
    this.wrong = int(statsData[1]);
    this.timeout = int(statsData[2]);
  }
  
  void save() { // Save stats to file
    String[] statsData = new String[3];
    
    statsData[0] = str(this.correct);
    statsData[1] = str(this.wrong);
    statsData[2] = str(this.timeout);
    
    saveStrings("data/stats.txt", statsData);
  }
  
  void correct() { // Increment correct answers
    this.correct++;
    this.save();
  }
  void wrong() { // Increment wrong answers
    this.wrong++;
    this.save();
  }
  void timeout() { // Increment timeouts
    this.timeout++;
    this.save();
  }
  
  int getTotal() { // Get total number of questions answered
    return this.correct + this.wrong + this.timeout;
  }
  float getPercentage() { // Get percentage of correct answers
    if (this.getTotal() == 0) {
      return 0;
    }
    return int((float(this.correct) / float(this.getTotal())) * 100);
  }
}