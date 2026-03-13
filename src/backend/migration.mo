import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Int "mo:core/Int";
import List "mo:core/List";

module {
  type Habit = {
    id : Text;
    name : Text;
    color : Text;
    icon : Text;
    importance : Nat;
    mode : { #normal; #timer };
    timerDuration : Nat;
    startTime : Text;
    dueTime : Text;
    graceEnabled : Bool;
    gracePeriod : Nat;
    repeatType : { #onetime; #daily };
    weekdays : [Nat];
    groupId : ?Text;
    hidden : Bool;
    createdAt : Int;
  };

  type Group = {
    id : Text;
    name : Text;
    color : Text;
  };

  type HabitLog = {
    id : Text;
    habitId : Text;
    date : Text;
    status : { #ontime; #late; #failed };
    completedAt : Int;
    pointsEarned : Float;
  };

  type AppSettings = {
    confirmDelete : Bool;
    mondayFirst : Bool;
    pauseTimers : Bool;
    darkMode : Bool;
    notificationLeadTime : Nat;
    completionGoal : Nat;
    impactGoal : Float;
    defaultHabitsView : { #daily; #weekly; #monthly };
    defaultStatsView : { #daily; #weekly; #monthly };
  };

  type UserProfile = {
    name : Text;
  };

  type OldActor = {
    userHabits : Map.Map<Principal, Map.Map<Text, Habit>>;
    userGroups : Map.Map<Principal, Map.Map<Text, Group>>;
    userHabitLogs : Map.Map<Principal, Map.Map<Text, HabitLog>>;
    userSettings : Map.Map<Principal, AppSettings>;
    userProfiles : Map.Map<Principal, UserProfile>;
  };

  type NewActor = {
    userHabitsMap : Map.Map<Principal, Map.Map<Text, Habit>>;
    userGroupsMap : Map.Map<Principal, Map.Map<Text, Group>>;
    userHabitLogsMap : Map.Map<Principal, Map.Map<Text, HabitLog>>;
    userSettings : Map.Map<Principal, AppSettings>;
    userProfiles : Map.Map<Principal, UserProfile>;
  };

  public func run(old : OldActor) : NewActor {
    {
      userHabitsMap = old.userHabits;
      userGroupsMap = old.userGroups;
      userHabitLogsMap = old.userHabitLogs;
      userSettings = old.userSettings;
      userProfiles = old.userProfiles;
    };
  };
};
