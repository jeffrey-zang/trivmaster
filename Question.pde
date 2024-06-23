class Question {
  String[] prompt;
  String answer;

  Question(String q, String a) {
    prompt = q.split(" ");
    answer = a;
  }

  int damerauLevenshtein(String s1, String s2) {
    int len1 = s1.length();
    int len2 = s2.length();
    
    // Create the distance matrix
    int[][] distance = new int[len1 + 1][len2 + 1];
    
    // Initialize the distance matrix
    for (int i = 0; i <= len1; i++) {
      distance[i][0] = i;
    }
    for (int j = 0; j <= len2; j++) {
      distance[0][j] = j;
    }
    
    // Compute the distance
    for (int i = 1; i <= len1; i++) {
      for (int j = 1; j <= len2; j++) {
        int cost = (s1.charAt(i - 1) == s2.charAt(j - 1)) ? 0 : 1;
        distance[i][j] = min(
          distance[i - 1][j] + 1, // Deletion
          distance[i][j - 1] + 1, // Insertion
          distance[i - 1][j - 1] + cost // Substitution
        );
        
        // Check for transposition
        if (i > 1 && j > 1 && s1.charAt(i - 1) == s2.charAt(j - 2) && s1.charAt(i - 2) == s2.charAt(j - 1)) {
          distance[i][j] = min(
            distance[i][j],
            distance[i - 2][j - 2] + cost // Transposition
          );
        }
      }
    }
    
    return distance[len1][len2];
  }

  void test() {
    String str1 = "among";
    String str2 = "amongj"; 
    
    int distance = damerauLevenshtein(str1, str2);
    println("Damerau-Levenshtein distance between \"" + str1 + "\" and \"" + str2 + "\": " + distance);
  }

}