using System;
using System.IO;
using System.Text.RegularExpressions;

class Program
{
    static void Main()
    {
        string text = File.ReadAllText(@"C:\Users\stone\.gemini\antigravity\brain\5aef59ee-8019-48a7-9bcb-aa09283fa701\.system_generated\logs\overview.txt");
        MatchCollection matches = Regex.Matches(text, @"<!DOCTYPE html>.*?<title>Stay Settings</title>.*?</html>", RegexOptions.Singleline);
        foreach (Match match in matches)
        {
            File.WriteAllText(@"C:\Users\stone\.gemini\antigravity\brain\5aef59ee-8019-48a7-9bcb-aa09283fa701\scratch\stay_settings.html", match.Value);
            Console.WriteLine("Found!");
            return;
        }
        Console.WriteLine("Not found!");
    }
}
