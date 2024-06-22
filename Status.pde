class StatusController {
  String currentStatus;

  StatusController() {
    this.currentStatus = "not started";
  }
  
  void startReading() {
    this.currentStatus = "reading";
  }
  void stopReading() {
    this.currentStatus = "buzzed";
    timeout = 0;
  }
  void visitStats() {
    this.currentStatus = "stats";
    buzzer.setText("Back to practice");
  }
  void visitSettings() {
    this.currentStatus = "settings";
    buzzer.setText("Back to practice");
  }
  void visitPractice() {
    this.currentStatus = "not started";
  }
  void timeout() {
    this.currentStatus = "timeout";
    buzzer.setText("Next Question");
  }
  void correct() {
    this.currentStatus = "correct";
    buzzer.setText("Next Question");
  }
  void wrong() {
    this.currentStatus = "wrong";
    buzzer.setText("Next Question");
  }
}
