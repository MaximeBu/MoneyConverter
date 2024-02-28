-- SQLite
create table HistoriqueConversions (
    id integer PRIMARY KEY AUTOINCREMENT,
    montantInitial double NOT NULL,
    montantConv double NOT NULL,
    deviseOrigine text NOT NULL,
    deviseDestination text NOT NULL,
    date date NOT NULL
)