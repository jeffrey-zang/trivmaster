class Question {
  String[] prompt;
  String answer;

  Question(String q, String a) {
    prompt = q.split(" ");
    answer = a;
  }

  int checkAnswer() { // Damerau-Levenshtein distance, used to calculate the number of operations (replacement, adding, removing) a string needs to become a different string. In other words, it's how similar two strings are (0 - identical, 1,2 - similar, 3+ - different)
  // this algorithm compares the user's answer to the correct answer
    String userAnswer = answer.getText();
    String correctAnswer = answer;

    int l1 = userAnswer.length(); // store lengths for use later
    int l2 = correntAnswer.length();
    
    // Create the distance matrix, a grid of size (l1 + 1) x (l2 + 1), which is used to store the cost of transforming the first i characters of s1 into the first j characters of s2
    int[][] distance = new int[l1 + 1][l2 + 1];
    
    // Initialize the distance matrix
    for (int i = 0; i <= l1; i++) {
      distance[i][0] = i;
    }
    for (int j = 0; j <= l2; j++) {
      distance[0][j] = j;
    }
    
    // Compute the distance
    for (int i = 1; i <= l1; i++) { // for each character in the user's answer
      for (int j = 1; j <= l2; j++) { // for each character in the correct answer
        int cost = (userAnswer.charAt(i - 1) == correctAnswer.charAt(j - 1)) ? 0 : 1; // if the characters are the same, the cost is 0, otherwise it's 1
        distance[i][j] = min(
          distance[i - 1][j] + 1, // Deletion
          distance[i][j - 1] + 1, // Insertion
          distance[i - 1][j - 1] + cost // Substitution
        ); // the cost of transforming the first i characters of s1 into the first j characters of s2 is the minimum of the cost of deleting, inserting, or substituting the characters
        
        // Check for transposition (swapping two adjacent characters)
        if (i > 1 && j > 1 && s1.charAt(i - 1) == s2.charAt(j - 2) && s1.charAt(i - 2) == s2.charAt(j - 1)) {
          distance[i][j] = min(
            distance[i][j],
            distance[i - 2][j - 2] + cost // Transposition
          );
        }
      }
    }
    
    return distance[l1][l2]; // return the cost of transforming the user's answer into the correct answer
  }
}