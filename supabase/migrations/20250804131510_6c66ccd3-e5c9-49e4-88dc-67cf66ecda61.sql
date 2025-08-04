-- Add theme settings to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN theme_settings jsonb DEFAULT '{
  "headerColor": "#8B9474",
  "avatarColor": "#F5A65B", 
  "textColor": "text-white",
  "mainColor": "#F3F4F6",
  "buttonColor": "#8B9474",
  "caseStatusColors": {
    "completed": "#F2FCE2",
    "in-progress": "#D3E4FD", 
    "delayed": "#FFCCCB",
    "analysis": "#FEF7CD"
  },
  "taskStatusColors": {
    "completed": "#F2FCE2",
    "in-progress": "#D3E4FD",
    "delayed": "#FFCCCB", 
    "analysis": "#FEF7CD"
  },
  "caseStatusTextColors": {
    "completed": "#1e3a1e",
    "in-progress": "#1e3a5a",
    "delayed": "#8B0000",
    "analysis": "#3a351e"
  }
}'::jsonb;