fn main() {
    if std::env::args().any(|argument| argument == "--version" || argument == "-V") {
        println!("SatisPlanner {}", env!("CARGO_PKG_VERSION"));
        return;
    }
    satisplanner_lib::run();
}
