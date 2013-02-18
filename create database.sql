-- phpMyAdmin SQL Dump
-- version 3.5.5
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Feb 18, 2013 at 04:20 PM
-- Server version: 5.1.66-cll
-- PHP Version: 5.2.17

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `cgxvhri_chess`
--

-- --------------------------------------------------------

--
-- Table structure for table `GamePlayers`
--

CREATE TABLE IF NOT EXISTS `GamePlayers` (
  `ID` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `GameID` int(10) unsigned NOT NULL,
  `PlayerNumber` smallint(5) unsigned NOT NULL,
  `UserID` int(10) unsigned NOT NULL,
  `IsDefeated` tinyint(1) unsigned NOT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `GameID` (`GameID`,`PlayerNumber`),
  KEY `UserID` (`UserID`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `Games`
--

CREATE TABLE IF NOT EXISTS `Games` (
  `ID` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `VariantID` int(10) unsigned NOT NULL,
  `HasStarted` tinyint(1) unsigned NOT NULL DEFAULT '0',
  `HasFinished` tinyint(1) unsigned NOT NULL DEFAULT '0',
  `CurrentTurnPlayerID` int(10) unsigned DEFAULT NULL,
  `TurnNumber` int(10) unsigned NOT NULL DEFAULT '1',
  `LastUpdated` int(10) unsigned NOT NULL,
  `TurnReportedAsDodgy` tinyint(1) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`ID`),
  KEY `NextTurnUserID` (`CurrentTurnPlayerID`),
  KEY `LastUpdated` (`LastUpdated`),
  KEY `VariantID` (`VariantID`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `Users`
--

CREATE TABLE IF NOT EXISTS `Users` (
  `ID` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `Name` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `Password` char(64) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `Salt` char(16) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `LastOnline` int(10) unsigned NOT NULL,
  `Prefs_CellReferences` tinyint(2) unsigned NOT NULL DEFAULT '2',
  PRIMARY KEY (`ID`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=3 ;

--
-- Dumping data for table `Users`
--

INSERT INTO `Users` (`ID`, `Name`, `Password`, `Salt`, `LastOnline`, `Prefs_CellReferences`) VALUES
(1, 'FTWinston', 'b6fcb195e476349a4d617e187be414bb3f4d06f870fdd21c04d0d17aa6c1e0b8', '18320de6588f62d5', 1345396468, 2);

-- --------------------------------------------------------

--
-- Table structure for table `Variants`
--

CREATE TABLE IF NOT EXISTS `Variants` (
  `ID` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) NOT NULL,
  `Description` text NOT NULL,
  `SortOrder` tinyint(3) unsigned NOT NULL DEFAULT '4',
  `Slug` varchar(100) NOT NULL,
  `CreatedBy` int(10) unsigned DEFAULT NULL,
  `Public` tinyint(1) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`ID`),
  UNIQUE KEY `Name` (`Name`),
  UNIQUE KEY `Slug` (`Slug`),
  KEY `CreatedBy` (`CreatedBy`),
  KEY `Public` (`Public`),
  KEY `SortOrder` (`SortOrder`,`Name`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=8 ;

--
-- Dumping data for table `Variants`
--

INSERT INTO `Variants` (`ID`, `Name`, `Description`, `SortOrder`, `Slug`, `CreatedBy`, `Public`) VALUES
(1, 'Orthodox Chess', 'Classic western chess, with en passant and castling, but currently no 3-repetition stalemate.', 1, 'orthodox', NULL, 1),
(2, 'Xiangqi (Chinese chess)', 'Classic Chinese chess, currently lacking piece graphics.', 2, 'xiangqi', NULL, 1),
(3, 'Shogi (Japanese chess)', 'Classic Japanese chess, currently lacking piece graphics.', 3, 'shogi', NULL, 1),
(4, 'Berolina Chess', 'Plays as per Orthodox chess, except that pawns are replaced by berolina pawns, which attack forward and move diagonally; the opposite of pawns.', 4, 'berolina', NULL, 1),
(5, 'Omega Chess', 'A commercial variant that is played on a 10x10 board with an extra square in each of the extreme corners, where the wizards are placed at the start of the game. The game is laid out like orthodox chess with the addition of a "champion" in each corner and a "wizard" diagonally behind each champion.', 4, 'omega', NULL, 1),
(6, 'Ultima', 'Ultima was created by veteran game designer Robert Abbott and published in Recreational Mathematics Magazine in August 1962. As yet it did not have a name. Abbott later included it in his 1963 book "Abbott''s New Card Games" under the title of ''Ultima''.', 4, 'ultima', NULL, 1),
(7, 'Perpendicular chess', 'An in-progress variant of my own devising, where players start on adjacent sides of the board.', 4, 'perpendicular', 1, 1);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
