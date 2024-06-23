class StatusController {
  String currentStatus;

  StatusController() {
    this.currentStatus = "not started";
  }
  
  void reset() {
    this.currentStatus = "not started";
    buzzer.setText("Start");
    answer.setPromptText("Type your answer here!");
    answer.setText("");
  }
  void startReading() {
    this.currentStatus = "reading";
    currentDisplayed = "";
    i = 0;
    timeout = 0;
    frame = 0;
    currentQ = questions.get(Math.round(random(0, questions.size())));
    answer.setText("");
    buzzer.setText("Buzz!");
  }
  void stopReading() {
    this.currentStatus = "buzzed";
    buzzer.setText("Submit Answer");
    answer.setPromptText("Type your answer here!");
    timeout = 0;
  }
  void visitStats() {
    this.currentStatus = "stats";
    buzzer.setText("Back to practice");
  }
  void visitPractice() {
    this.currentStatus = "not started";
  }
  void timeout() {
    this.currentStatus = "timeout";
    buzzer.setText("Next Question");
    statsController.timeout();
  }
  void correct() {
    this.currentStatus = "correct";
    buzzer.setText("Next Question");
    statsController.correct();
  }
  void wrong() {
    this.currentStatus = "wrong";
    buzzer.setText("Next Question");
    statsController.wrong();
  }
}
