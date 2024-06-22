class Question {
  String[] prompt;
  String answer;

  Question(String q, String a) {
    prompt = q.split(" ");
    answer = a;
  }
}