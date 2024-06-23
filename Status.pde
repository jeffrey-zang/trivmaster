class StatusController {
  String currentStatus;
  
  StatusController() {
    this.currentStatus = "not started";
  }
  
  void reset() { // reset buzzing progress to prepare for a new question
    this.currentStatus = "not started";
    buzzer.setText("Start");
    answer.setPromptText("Type your answer here!");
    answer.setText("");
  }
  void startReading() { // start reading a new question
    this.currentStatus = "reading";
    currentDisplayed = "";
    currentWord = 0;
    timeout = 0;
    frame = 0;
    currentQ = questions.get(Math.round(random(0, questions.size())));
    answer.setText("");
    buzzer.setText("Buzz!");
  }
  void stopReading() { // stop reading and prepare for answer
    this.currentStatus = "buzzed";
    buzzer.setText("Submit Answer");
    answer.setPromptText("Type your answer here!");
    timeout = 0;
  }
  void visitStats() { // visit stats page
    this.currentStatus = "stats";
    buzzer.setText("Back to practice");
  }
  void visitPractice() { // visit practice page
    this.currentStatus = "not started";
  }
  void timeout() { // handle timeout
    this.currentStatus = "timeout";
    buzzer.setText("Next Question");
    statsController.timeout();
  }
  void correct() { // handle correct answer
    this.currentStatus = "correct";
    buzzer.setText("Next Question");
    statsController.correct();
  }
  void wrong() { // handle wrong answer
    this.currentStatus = "wrong";
    buzzer.setText("Next Question");
    statsController.wrong();
  }
}
