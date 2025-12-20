{
  "Streams": [
    {
      "Stream_Id": "stream-001",
      "Stream_Name": "Marketing Campaign",
      "Stream_Type": "Project",
      "Description": "Plan and execute Q2 marketing campaign",
      "Source_Identifier": "source-001",
      "Color": "blue",
      "Icon": "star",
      "Active": true,
      "Created_Date": "2025-01-01",
      "Modified_Date": "2025-01-15",
      "Owner": "John Doe"
    }
  ],
  "Tasks": [
    {
      "Task_Id": "task-001",
      "Stream_Id": "stream-001",
      "Parent_Id": "",
      "What": "Create campaign strategy",
      "When": "2025-02-01",
      "Who": "John Doe",
      "How": "Brainstorming session",
      "Category": "TASK",
      "Priority": "HIGH",
      "Status": "NEW",
      "Complexity": "MEDIUM",
      "Estimated_Time": "4h",
      "Dependencies": "",
      "Required_Resources": "Marketing team",
      "Potential_Obstacles": "Time constraints"
    }
  ],
  "Projects": [
    {
      "Project_Id": "project-001",
      "Stream_Id": "stream-001",
      "Parent_Id": "",
      "What": "Launch Q2 Marketing Campaign",
      "When": "2025-03-01",
      "Who": "John Doe",
      "How": "Coordinate with teams",
      "Category": "PROJECT",
      "Priority": "HIGH",
      "Status": "IN_PROGRESS",
      "Deadline": "2025-03-31",
      "Team_Members": "John Doe, Jane Smith",
      "Tags": "marketing, campaign",
      "Effort": "HIGH",
      "Expected_Impact": "HIGH",
      "Suggested_Timeline": "3 months",
      "Proposer": "John Doe",
      "Notes": "Ensure all teams are aligned"
    }
  ],
  "Task_Relationships": [
    {
      "Relationship_ID": "rel-001",
      "Task_From": "task-001",
      "Task_To": "task-002",
      "Type": "FS",
      "Lag": "2d",
      "Is_Critical_Path": true,
      "Notes": "Task 2 cannot start until Task 1 is completed"
    }
  ],
  "Task_History": [
    {
      "History_Id": "hist-001",
      "Task_Id": "task-002",
      "Changed_By": "John Doe",
      "Change_Date": "2025-02-06 10:00:00",
      "Field_Name": "Status",
      "Old_Value": "NEW",
      "New_Value": "IN_PROGRESS"
    }
  ],
  "Contacts": [
    {
      "Contact_Id": "contact-001",
      "Stream_Id": "stream-002",
      "Parent_Id": "",
      "Company_Name": "TechSolutions",
      "Contact_Name": "Mark Johnson",
      "Email": "mark.johnson@techsolutions.com",
      "Phone": "+48 600 123 456",
      "Role": "Sales Manager",
      "Category": "CONTACT"
    }
  ],
  "Meetings": [
    {
      "Meeting_Id": "meeting-001",
      "Stream_Id": "stream-001",
      "Parent_Id": "",
      "What": "Campaign kickoff meeting",
      "When": "2025-02-10 14:00:00",
      "Who": "John Doe",
      "How": "Discuss campaign strategy",
      "Category": "MEETING",
      "Location": "Conference Room",
      "Duration": 2
    }
  ],
  "Invoices": [
    {
      "Invoice_Id": "invoice-001",
      "Stream_Id": "stream-002",
      "Parent_Id": "",
      "What": "Payment for marketing services",
      "When": "2025-02-15",
      "Who": "Jane Smith",
      "How": "Bank transfer",
      "Category": "INVOICE",
      "Invoice_Number": "INV-2025/001",
      "Amount": "1000.00",
      "Currency": "PLN",
      "Status": "PENDING",
      "Priority": "HIGH"
    }
  ],
  "Recurring_Tasks": [
    {
      "Recurring_Task_Id": "recur-001",
      "Stream_Id": "stream-001",
      "Parent_Id": "",
      "What": "Weekly campaign report",
      "When": "Every Monday",
      "Who": "John Doe",
      "How": "Compile data",
      "Category": "RECURRING_TASK",
      "Frequency": "WEEKLY",
      "Pattern": "",
      "Next_Occurrence": "2025-02-12"
    }
  ],
  "Smart": [
    {
      "Smart_Id": "smart-001",
      "Stream_Id": "stream-001",
      "Parent_Id": "",
      "Task_Id": "task-001",
      "Specific": true,
      "Measurable": true,
      "Achievable": true,
      "Relevant": true,
      "Time_Bound": true
    }
  ],
  "Timeline": [
    {
      "Timeline_Id": "timeline-001",
      "Stream_Id": "stream-001",
      "Event_Id": "event-001",
      "Event_Type": "Campaign Launch",
      "Title": "Campaign Kickoff",
      "Start_Date": "2025-02-10 14:00:00",
      "End_Date": "2025-02-10 16:00:00",
      "Status": "SCHEDULED"
    }
  ],
  "Tags": [
    {
      "Tag_Id": "tag-001",
      "Stream_Id": "stream-001",
      "Tag_Name": "Marketing",
      "Tag_Color": "blue",
      "Tag_Category": "Category",
      "Usage_Count": 5
    }
  ],
  "Context": [
    {
      "Context_Id": "context-001",
      "Stream_Id": "stream-001",
      "Context_Name": "Campaign Planning",
      "Description": "High-level planning for Q2 campaign",
      "Energy_Level_Required": "HIGH"
    }
  ],
  "Waiting_For": [
    {
      "Waiting_Id": "wait-001",
      "Stream_Id": "stream-001",
      "Task_Id": "task-002",
      "Waiting_For_Who": "Client",
      "Since_Date": "2025-02-06",
      "Expected_Response_Date": "2025-02-10",
      "Follow_Up_Date": "2025-02-12",
      "Status": "PENDING"
    }
  ],
  "Energy_Levels": [
    {
      "Energy_Id": "energy-001",
      "Stream_Id": "stream-001",
      "Task_Id": "task-001",
      "Level": 8,
      "Time_Required": 4,
      "Focus_Required": "HIGH"
    }
  ],
  "Weekly_Review": [
    {
      "Review_Id": "review-001",
      "Stream_Id": "stream-001",
      "Review_Date": "2025-02-07",
      "Completed_Tasks_Count": 5,
      "New_Tasks_Count": 2,
      "Stalled_Tasks": 1,
      "Next_Actions": "Follow up with client, Review campaign visuals",
      "Notes": "Client feedback is delayed"
    }
  ],
  "Dependencies": [
    {
      "Dependency_Id": "dep-001",
      "Stream_Id": "stream-001",
      "Source_Task_Id": "task-001",
      "Dependent_Task_Id": "task-002",
      "Dependency_Type": "FS",
      "Critical_Path": true
    }
  ],
  "Areas_Of_Responsibility": [
    {
      "Area_Id": "area-001",
      "Stream_Id": "stream-001",
      "Area_Name": "Marketing",
      "Description": "Responsible for all marketing activities",
      "Owner": "John Doe",
      "Related_Projects": "project-001"
    }
  ],
  "Habits": [
    {
      "Habit_Id": "habit-001",
      "Stream_Id": "stream-001",
      "Habit_Name": "Daily standup",
      "Frequency": "DAILY",
      "Streak_Current": 10,
      "Streak_Best": 15,
      "Start_Date": "2025-01-01"
    }
  ],
  "Delegated_Tasks": [
    {
      "Delegation_Id": "deleg-001",
      "Stream_Id": "stream-001",
      "Task_Id": "task-002",
      "Delegated_To": "Jane Smith",
      "Delegated_On": "2025-02-05",
      "Follow_Up_Date": "2025-02-10",
      "Status": "IN_PROGRESS"
    }
  ],
  "Files": [
    {
      "File_Id": "file-001",
      "Stream_Id": "stream-001",
      "Parent_Id": "task-001",
      "File_Name": "Campaign_Strategy.pdf",
      "File_Type": "PDF",
      "URL_Path": "/files/campaign_strategy.pdf",
      "Upload_Date": "2025-02-01"
    }
  ],
  "Knowledge_Base": [
    {
      "KB_Id": "kb-001",
      "Stream_Id": "stream-001",
      "Title": "Campaign Best Practices",
      "Content": "1. Define goals 2. Identify audience",
      "Category": "Marketing",
      "Tags": "best practices, campaign",
      "Related_Items": "task-001"
    }
  ],
  "GTD_Buckets": [
    {
      "Bucket_Id": "bucket-001",
      "Stream_Id": "stream-001",
      "Name": "Active Projects",
      "Description": "Projects currently in progress",
      "View_Order": 1
    }
  ],
  "Weekly_Review_Checklist": [
    {
      "Review_Id": "checklist-001",
      "Stream_Id": "stream-001",
      "Review_Date": "2025-02-07",
      "Collect_Loose_Papers": true,
      "Process_Notes": true,
      "Empty_Inbox": true,
      "Process_Voicemails": true,
      "Review_Action_Lists": true,
      "Review_Calendar": true,
      "Review_Projects": true,
      "Review_Waiting_For": true,
      "Review_Someday_Maybe": true,
      "Review_Notes": "All tasks reviewed"
    }
  ],
  "GTD_Horizons": [
    {
      "Horizon_Id": "horizon-001",
      "Stream_Id": "stream-001",
      "Level": 1,
      "Name": "Strategic",
      "Description": "Long-term goals",
      "Review_Frequency": "QUARTERLY"
    }
  ],
  "SMART_Analysis_Details": [
    {
      "Analysis_Id": "smart-analysis-001",
      "Stream_Id": "stream-001",
      "Task_Id": "task-001",
      "Specific_Score": 9,
      "Specific_Notes": "Clear objectives defined",
      "Measurable_Score": 8,
      "Measurable_Criteria": "KPIs identified",
      "Achievable_Score": 7,
      "Achievable_Resources": "Resources allocated",
      "Relevant_Score": 9,
      "Relevant_Alignment": "Aligned with company goals",
      "Time_Bound_Score": 8,
      "Time_Estimation_Accuracy": "Accurate time estimation"
    }
  ],
  "SMART_Improvements": [
    {
      "Improvement_Id": "smart-improve-001",
      "Stream_Id": "stream-001",
      "Task_Id": "task-001",
      "SMART_Dimension": "Specific",
      "Current_State": "Objectives are clear",
      "Suggested_Improvement": "Add more detailed KPIs",
      "Status": "OPEN"
    }
  ],
  "SMART_Templates": [
    {
      "Template_Id": "template-001",
      "Stream_Id": "stream-001",
      "Template_Name": "Campaign Template",
      "Task_Template": "1. Define goals 2. Identify audience",
      "Measurable_Criteria": "KPIs: Reach, Engagement",
      "Typical_Resources": "Marketing team, Design software",
      "Estimated_Duration": 14,
      "Typical_Dependencies": "task-001, task-002"
    }
  ],
  "Leads": [
    {
      "Lead_Id": "lead-001",
      "Stream_Id": "stream-002",
      "Parent_Id": "",
      "What": "Follow up with TechSolutions",
      "When": "2025-02-10",
      "Who": "John Doe",
      "How": "Email",
      "Category": "LEAD",
      "Company": "TechSolutions",
      "Contact_Person": "Mark Johnson",
      "Status": "NEW",
      "Priority": "HIGH"
    }
  ],
  "Orders": [
    {
      "Order_Id": "order-001",
      "Stream_Id": "stream-002",
      "Parent_Id": "",
      "What": "Process order for TechSolutions",
      "When": "2025-02-12",
      "Who": "Jane Smith",
      "How": "Email",
      "Category": "ORDER",
      "Order_Number": "ORD-2025/001",
      "Customer": "TechSolutions",
      "Status": "CONFIRMED",
      "Priority": "HIGH"
    }
  ],
  "Someday_Maybe": [
    {
      "Someday_Maybe_Id": "someday-001",
      "Stream_Id": "stream-001",
      "Parent_Id": "",
      "What": "Explore new marketing channels",
      "When": "",
      "Who": "",
      "How": "Research",
      "Category": "SOMEDAY_MAYBE",
      "Priority": "LOW",
      "Notes": "Potential for growth",
      "Effort": "MEDIUM",
      "Expected_Impact": "HIGH",
      "Complexity": "MEDIUM",
      "Suggested_Timeline": "6 months",
      "Proposer": "John Doe"
    }
  ],
  "Complaints": [
    {
      "Complaint_Id": "complaint-001",
      "Stream_Id": "stream-002",
      "Parent_Id": "",
      "What": "Customer complaint about delivery delay",
      "When": "2025-02-10",
      "Who": "Jane Smith",
      "How": "Investigate",
      "Category": "COMPLAINT",
      "Customer": "TechSolutions",
      "Product": "Product X",
      "Status": "NEW",
      "Priority": "HIGH"
    }
  ],
  "Info": [
    {
      "Info_Id": "info-001",
      "Stream_Id": "stream-001",
      "Parent_Id": "",
      "What": "New marketing trends",
      "When": "2025-02-15",
      "Who": "John Doe",
      "How": "Research",
      "Category": "INFO",
      "Topic": "Marketing Trends",
      "Importance": "HIGH"
    }
  ],
  "Auto_Replies": [
    {
      "Auto_Reply_Id": "auto-001",
      "Stream_Id": "stream-001",
      "Parent_Id": "",
      "Sender": "TechSolutions",
      "Message": "Thank you for your email. We will respond shortly.",
      "Action_Date": "2025-02-10",
      "Category": "AUTO_REPLY",
      "Status": "ACTIVE",
      "Priority": "LOW"
    }
  ],
  "Unimportant": [
    {
      "Unimportant_Id": "unimportant-001",
      "Stream_Id": "stream-001",
      "Parent_Id": "",
      "Content": "Promotional email",
      "Type": "Promotion",
      "Category": "UNIMPORTANT",
      "Source": "Newsletter"
    }
  ],
  "Completeness": [
    {
      "Completeness_Id": "complete-001",
      "Stream_Id": "stream-001",
      "Parent_Id": "task-001",
      "Is_Complete": true,
      "Missing_Info": "",
      "Clarity": "Clear objectives"
    }
  ],
  "Recommendations": [
    {
      "Recommendation_Id": "recommend-001",
      "Parent_Id": "stream-001",
      "Reference_Id": "task-001",
      "Content": "Consider using social media ads",
      "Status": "OPEN",
      "Priority": "MEDIUM"
    }
  ],
  "Metadata": [
    {
      "Meta_ID": "meta-001",
      "Confidence": 0.95,
      "Ambiguity": "Slight ambiguity in task description",
      "Raw_Text": "Task: Create campaign strategy"
    }
  ],
  "Focus_Modes": [
    {
      "Focus_Id": "focus-001",
      "Stream_Id": "stream-001",
      "Name": "Deep Work",
      "Duration": 2,
      "Energy_Level": "HIGH",
      "Context": "Campaign Planning",
      "Estimated_Time_Max": 4,
      "Category": "Work",
      "Priority": "HIGH",
      "Tags": "focus, productivity"
    }
  ],
  "Email_Analisis": [
    {
      "ID": "email-001",
      "Timestamp": "2025-02-10 10:00:00",
      "Email_From": "marketing@techsolutions.com",
      "Email_Subject": "Campaign Update",
      "Email_Received": "2025-02-10 10:05:00",
      "Categories": "TASK, PROJECT",
      "Confidence_Score": 0.92,
      "Summary": "Discuss campaign strategy",
      "Full_Analysis": "Full analysis of email content",
      "Raw_Text": "Raw email text",
      "Processing_Time": 5,
      "Token_Count": 120
    }
  ],
  "Task_Relationships": [
    {
      "Relationship_ID": "rel-001",
      "Task_From": "task-001",
      "Task_To": "task-002",
      "Type": "FS",
      "Lag": "2d",
      "Is_Critical_Path": true,
      "Notes": "Task 2 cannot start until Task 1 is completed"
    }
  ],
  "Critical_Path": [
    {
      "Path_ID": "path-001",
      "Tasks": "task-001, task-002",
      "Total_Duration": "10d",
      "Earliest_Completion": "2025-02-15",
      "Slack": "0d"
    }
  ]
}