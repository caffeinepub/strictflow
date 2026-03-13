import Array "mo:core/Array";
import List "mo:core/List";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Migration "migration";

(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

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

  module Habit {
    type HabitId = Text;
    public func compare(habit1 : Habit, habit2 : Habit) : Order.Order {
      Text.compare(habit1.id, habit2.id);
    };

    public func compareByName(habit1 : Habit, habit2 : Habit) : Order.Order {
      Text.compare(habit1.name, habit2.name);
    };

    public func compareById(id1 : HabitId, id2 : HabitId) : Order.Order {
      Text.compare(id1, id2);
    };
  };

  type Group = {
    id : Text;
    name : Text;
    color : Text;
  };

  module Group {
    public func compare(group1 : Group, group2 : Group) : Order.Order {
      Text.compare(group1.id, group2.id);
    };
  };

  type HabitLog = {
    id : Text;
    habitId : Text;
    date : Text;
    status : { #ontime; #late; #failed };
    completedAt : Int;
    pointsEarned : Float;
  };

  module HabitLog {
    public func compare(log1 : HabitLog, log2 : HabitLog) : Order.Order {
      Text.compare(log1.id, log2.id);
    };

    public func compareByDate(log1 : HabitLog, log2 : HabitLog) : Order.Order {
      Text.compare(log1.date, log2.date);
    };

    public func compareByHabitId(log1 : HabitLog, log2 : HabitLog) : Order.Order {
      Text.compare(log1.habitId, log2.habitId);
    };
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

  public type UserProfile = {
    name : Text;
  };

  var userHabitsMap : Map.Map<Principal, Map.Map<Text, Habit>> = Map.empty<Principal, Map.Map<Text, Habit>>();
  var userGroupsMap : Map.Map<Principal, Map.Map<Text, Group>> = Map.empty<Principal, Map.Map<Text, Group>>();
  var userHabitLogsMap : Map.Map<Principal, Map.Map<Text, HabitLog>> = Map.empty<Principal, Map.Map<Text, HabitLog>>();
  var userSettings : Map.Map<Principal, AppSettings> = Map.empty<Principal, AppSettings>();
  var userProfiles : Map.Map<Principal, UserProfile> = Map.empty<Principal, UserProfile>();

  // Helper function to get or create user's habit map
  func getUserHabitsMap(user : Principal) : Map.Map<Text, Habit> {
    switch (userHabitsMap.get(user)) {
      case (null) {
        let newMap = Map.empty<Text, Habit>();
        userHabitsMap.add(user, newMap);
        newMap;
      };
      case (?existingMap) { existingMap };
    };
  };

  // Helper function to get or create user's group map
  func getUserGroupsMap(user : Principal) : Map.Map<Text, Group> {
    switch (userGroupsMap.get(user)) {
      case (null) {
        let newMap = Map.empty<Text, Group>();
        userGroupsMap.add(user, newMap);
        newMap;
      };
      case (?existingMap) { existingMap };
    };
  };

  // Helper function to get or create user's habit logs map
  func getUserHabitLogsMap(user : Principal) : Map.Map<Text, HabitLog> {
    switch (userHabitLogsMap.get(user)) {
      case (null) {
        let newMap = Map.empty<Text, HabitLog>();
        userHabitLogsMap.add(user, newMap);
        newMap;
      };
      case (?existingMap) { existingMap };
    };
  };

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Habit CRUD Functions
  public shared ({ caller }) func createHabit(
    id : Text,
    name : Text,
    color : Text,
    icon : Text,
    importance : Nat,
    mode : { #normal; #timer },
    timerDuration : Nat,
    startTime : Text,
    dueTime : Text,
    graceEnabled : Bool,
    gracePeriod : Nat,
    repeatType : { #onetime; #daily },
    weekdays : [Nat],
    groupId : ?Text,
    hidden : Bool,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create habits");
    };

    if (name == "") { Runtime.trap("Cannot create a habit without a name!") };
    
    let habits = getUserHabitsMap(caller);
    if (habits.containsKey(id)) { Runtime.trap("Habit with that id (" # id # ") already exists!") };

    let habit : Habit = {
      id;
      name;
      color;
      icon;
      importance;
      mode;
      timerDuration;
      startTime;
      dueTime;
      graceEnabled;
      gracePeriod;
      repeatType;
      weekdays;
      groupId;
      hidden;
      createdAt = Time.now();
    };
    habits.add(id, habit);
  };

  public shared ({ caller }) func updateHabit(
    id : Text,
    name : Text,
    color : Text,
    icon : Text,
    importance : Nat,
    mode : { #normal; #timer },
    timerDuration : Nat,
    startTime : Text,
    dueTime : Text,
    graceEnabled : Bool,
    gracePeriod : Nat,
    repeatType : { #onetime; #daily },
    weekdays : [Nat],
    groupId : ?Text,
    hidden : Bool,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update habits");
    };

    let habits = getUserHabitsMap(caller);
    switch (habits.get(id)) {
      case (null) { Runtime.trap("Habit does not exist!") };
      case (?existingHabit) {
        let updatedHabit : Habit = {
          id;
          name;
          color;
          icon;
          importance;
          mode;
          timerDuration;
          startTime;
          dueTime;
          graceEnabled;
          gracePeriod;
          repeatType;
          weekdays;
          groupId;
          hidden;
          createdAt = existingHabit.createdAt;
        };
        habits.add(id, updatedHabit);
      };
    };
  };

  public shared ({ caller }) func deleteHabit(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete habits");
    };

    let habits = getUserHabitsMap(caller);
    if (not habits.containsKey(id)) { Runtime.trap("Trying to delete non-existent habit (" # id # ")") };
    habits.remove(id);
  };

  public query ({ caller }) func getHabits() : async [Habit] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view habits");
    };

    let habits = getUserHabitsMap(caller);
    habits.values().toArray().sort();
  };

  public query ({ caller }) func getHabit(id : Text) : async Habit {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view habits");
    };

    let habits = getUserHabitsMap(caller);
    switch (habits.get(id)) {
      case (null) { Runtime.trap("Habit does not exist! (" # id # ")") };
      case (?habit) { habit };
    };
  };

  // Group CRUD Functions
  public shared ({ caller }) func createGroup(id : Text, name : Text, color : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create groups");
    };

    if (name == "") { Runtime.trap("Cannot create a group without a name!") };
    
    let groups = getUserGroupsMap(caller);
    if (groups.containsKey(id)) { Runtime.trap("Group with that id (" # id # ") already exists!") };

    let group : Group = {
      id;
      name;
      color;
    };
    groups.add(id, group);
  };

  public shared ({ caller }) func updateGroup(id : Text, name : Text, color : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update groups");
    };

    let groups = getUserGroupsMap(caller);
    switch (groups.get(id)) {
      case (null) { Runtime.trap("Group does not exist!") };
      case (?existingGroup) {
        let updatedGroup : Group = {
          id;
          name;
          color;
        };
        groups.add(id, updatedGroup);
      };
    };
  };

  public shared ({ caller }) func deleteGroup(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete groups");
    };

    let groups = getUserGroupsMap(caller);
    if (not groups.containsKey(id)) { Runtime.trap("Trying to delete non-existent group (" # id # ")") };
    groups.remove(id);
  };

  public query ({ caller }) func getGroups() : async [Group] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view groups");
    };

    let groups = getUserGroupsMap(caller);
    groups.values().toArray().sort();
  };

  // Habit Log Functions
  public shared ({ caller }) func logHabitCompletion(
    id : Text,
    habitId : Text,
    date : Text,
    status : { #ontime; #late; #failed },
    completedAt : Int,
    pointsEarned : Float,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can log habit completions");
    };

    let habitLogs = getUserHabitLogsMap(caller);
    if (habitLogs.containsKey(id)) { Runtime.trap("Already logged that habit completion!") };

    let log : HabitLog = {
      id;
      habitId;
      date;
      status;
      completedAt;
      pointsEarned;
    };
    habitLogs.add(id, log);
  };

  public shared ({ caller }) func deleteLogsByRange(rangeType : { #day : Text; #week : Text; #month : Text; #alltime }) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete logs");
    };

    switch (rangeType) {
      case (#day _) {};
      case (#week _) {};
      case (#month _) {};
      case (#alltime) {};
    };
  };

  public query ({ caller }) func getLogsByDateRange(startDate : Text, endDate : Text) : async [HabitLog] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view logs");
    };

    let habitLogs = getUserHabitLogsMap(caller);
    habitLogs.values().toArray().sort(HabitLog.compareByDate);
  };

  public query ({ caller }) func getLogsByHabit(habitId : Text) : async [HabitLog] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view logs");
    };

    let habitLogs = getUserHabitLogsMap(caller);
    habitLogs.values().toArray().sort(HabitLog.compareByHabitId);
  };

  // Settings Functions
  public shared ({ caller }) func updateSettings(newSettings : AppSettings) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update settings");
    };

    userSettings.add(caller, newSettings);
  };

  public query ({ caller }) func getSettings() : async AppSettings {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view settings");
    };

    switch (userSettings.get(caller)) {
      case (null) {
        {
          confirmDelete = true;
          mondayFirst = false;
          pauseTimers = false;
          darkMode = false;
          notificationLeadTime = 30;
          completionGoal = 10;
          impactGoal = 80.0;
          defaultHabitsView = #daily;
          defaultStatsView = #daily;
        };
      };
      case (?currentSettings) {
        currentSettings;
      };
    };
  };

  // Stats Functions
  public query ({ caller }) func getOverviewStats(_startDate : Text, _endDate : Text) : async {
    totalCompletions : Nat;
    lateCount : Nat;
    failedCount : Nat;
    onTimeCount : Nat;
    totalPoints : Float;
    maxPoints : Float;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view stats");
    };

    { totalCompletions = 0; lateCount = 0; failedCount = 0; onTimeCount = 0; totalPoints = 0.0; maxPoints = 0.0 };
  };

  public query ({ caller }) func getHabitStats(habitId : Text) : async {
    completionCount : Nat;
    lateCount : Nat;
    failedCount : Nat;
    totalPoints : Float;
    streak : Nat;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view habit stats");
    };

    { completionCount = 0; lateCount = 0; failedCount = 0; totalPoints = 0.0; streak = 0 };
  };

  public query ({ caller }) func getDailyCompletionHistory(startDate : Text, endDate : Text) : async [(Text, Nat, Float)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view completion history");
    };

    [];
  };
};
