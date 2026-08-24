/**
 * Точечный набор иконок.
 *
 * Раньше подключалась вся библиотека lucide — это 516 КБ кода ради
 * сотни картинок. Здесь только те, что реально встречаются на сайте,
 * плюс запас для выбора в админке.
 */
import { LucideProps } from 'lucide-react';
import { FC } from 'react';

import Aperture from 'lucide-react/dist/esm/icons/aperture';
import ArrowDown from 'lucide-react/dist/esm/icons/arrow-down';
import ArrowDownAZ from 'lucide-react/dist/esm/icons/arrow-down-a-z';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import ArrowUp from 'lucide-react/dist/esm/icons/arrow-up';
import ArrowUpRight from 'lucide-react/dist/esm/icons/arrow-up-right';
import Award from 'lucide-react/dist/esm/icons/award';
import BadgeCheck from 'lucide-react/dist/esm/icons/badge-check';
import BadgePercent from 'lucide-react/dist/esm/icons/badge-percent';
import Battery from 'lucide-react/dist/esm/icons/battery';
import Bell from 'lucide-react/dist/esm/icons/bell';
import BookOpen from 'lucide-react/dist/esm/icons/book-open';
import Bookmark from 'lucide-react/dist/esm/icons/bookmark';
import Boxes from 'lucide-react/dist/esm/icons/boxes';
import Building2 from 'lucide-react/dist/esm/icons/building-2';
import Cable from 'lucide-react/dist/esm/icons/cable';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Camera from 'lucide-react/dist/esm/icons/camera';
import Car from 'lucide-react/dist/esm/icons/car';
import CarFront from 'lucide-react/dist/esm/icons/car-front';
import Check from 'lucide-react/dist/esm/icons/check';
import CheckCheck from 'lucide-react/dist/esm/icons/check-check';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';
import CircleAlert from 'lucide-react/dist/esm/icons/circle-alert';
import CircleCheck from 'lucide-react/dist/esm/icons/circle-check';
import CircleHelp from 'lucide-react/dist/esm/icons/circle-help';
import CircleSlash from 'lucide-react/dist/esm/icons/circle-slash';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Copy from 'lucide-react/dist/esm/icons/copy';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import Download from 'lucide-react/dist/esm/icons/download';
import Edit from 'lucide-react/dist/esm/icons/edit';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import Eye from 'lucide-react/dist/esm/icons/eye';
import EyeOff from 'lucide-react/dist/esm/icons/eye-off';
import FileDown from 'lucide-react/dist/esm/icons/file-down';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Filter from 'lucide-react/dist/esm/icons/filter';
import FolderInput from 'lucide-react/dist/esm/icons/folder-input';
import Frame from 'lucide-react/dist/esm/icons/frame';
import Gauge from 'lucide-react/dist/esm/icons/gauge';
import Gift from 'lucide-react/dist/esm/icons/gift';
import Headphones from 'lucide-react/dist/esm/icons/headphones';
import Heart from 'lucide-react/dist/esm/icons/heart';
import History from 'lucide-react/dist/esm/icons/history';
import Home from 'lucide-react/dist/esm/icons/home';
import ImageDown from 'lucide-react/dist/esm/icons/image-down';
import Info from 'lucide-react/dist/esm/icons/info';
import Instagram from 'lucide-react/dist/esm/icons/instagram';
import Key from 'lucide-react/dist/esm/icons/key';
import Layers from 'lucide-react/dist/esm/icons/layers';
import LayoutGrid from 'lucide-react/dist/esm/icons/layout-grid';
import Lightbulb from 'lucide-react/dist/esm/icons/lightbulb';
import Link from 'lucide-react/dist/esm/icons/link';
import List from 'lucide-react/dist/esm/icons/list';
import ListOrdered from 'lucide-react/dist/esm/icons/list-ordered';
import Loader from 'lucide-react/dist/esm/icons/loader';
import Lock from 'lucide-react/dist/esm/icons/lock';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import Mail from 'lucide-react/dist/esm/icons/mail';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Menu from 'lucide-react/dist/esm/icons/menu';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import Minus from 'lucide-react/dist/esm/icons/minus';
import MonitorSmartphone from 'lucide-react/dist/esm/icons/monitor-smartphone';
import Music from 'lucide-react/dist/esm/icons/music';
import Package from 'lucide-react/dist/esm/icons/package';
import ParkingCircle from 'lucide-react/dist/esm/icons/parking-circle';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Percent from 'lucide-react/dist/esm/icons/percent';
import Phone from 'lucide-react/dist/esm/icons/phone';
import PhoneCall from 'lucide-react/dist/esm/icons/phone-call';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Printer from 'lucide-react/dist/esm/icons/printer';
import Radio from 'lucide-react/dist/esm/icons/radio';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw';
import Save from 'lucide-react/dist/esm/icons/save';
import Search from 'lucide-react/dist/esm/icons/search';
import GitCompare from 'lucide-react/dist/esm/icons/git-compare';
import Scale from 'lucide-react/dist/esm/icons/scale';
import Maximize2 from 'lucide-react/dist/esm/icons/maximize-2';
import Send from 'lucide-react/dist/esm/icons/send';
import Settings from 'lucide-react/dist/esm/icons/settings';
import Share2 from 'lucide-react/dist/esm/icons/share-2';
import Sheet from 'lucide-react/dist/esm/icons/sheet';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import ShoppingCart from 'lucide-react/dist/esm/icons/shopping-cart';
import SkipForward from 'lucide-react/dist/esm/icons/skip-forward';
import SlidersHorizontal from 'lucide-react/dist/esm/icons/sliders-horizontal';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Speaker from 'lucide-react/dist/esm/icons/speaker';
import Square from 'lucide-react/dist/esm/icons/square';
import Star from 'lucide-react/dist/esm/icons/star';
import Store from 'lucide-react/dist/esm/icons/store';
import Tag from 'lucide-react/dist/esm/icons/tag';
import Timer from 'lucide-react/dist/esm/icons/timer';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import TriangleAlert from 'lucide-react/dist/esm/icons/triangle-alert';
import Truck from 'lucide-react/dist/esm/icons/truck';
import Undo2 from 'lucide-react/dist/esm/icons/undo-2';
import Upload from 'lucide-react/dist/esm/icons/upload';
import User from 'lucide-react/dist/esm/icons/user';
import Users from 'lucide-react/dist/esm/icons/users';
import Video from 'lucide-react/dist/esm/icons/video';
import VolumeX from 'lucide-react/dist/esm/icons/volume-x';
import Wallet from 'lucide-react/dist/esm/icons/wallet';
import Wrench from 'lucide-react/dist/esm/icons/wrench';
import X from 'lucide-react/dist/esm/icons/x';
import Youtube from 'lucide-react/dist/esm/icons/youtube';
import Zap from 'lucide-react/dist/esm/icons/zap';

export const ICONS: Record<string, FC<LucideProps>> = {
  Aperture,
  ArrowDown,
  ArrowDownAZ,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Award,
  BadgeCheck,
  BadgePercent,
  Battery,
  Bell,
  BookOpen,
  Bookmark,
  Boxes,
  Building2,
  Cable,
  Calendar,
  Camera,
  Car,
  CarFront,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  CircleSlash,
  Clock,
  Copy,
  CreditCard,
  Download,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  FileDown,
  FileText,
  Filter,
  FolderInput,
  Frame,
  Gauge,
  Gift,
  Headphones,
  Heart,
  History,
  Home,
  ImageDown,
  Info,
  Instagram,
  Key,
  Layers,
  LayoutGrid,
  Lightbulb,
  Link,
  List,
  ListOrdered,
  Loader,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Minus,
  MonitorSmartphone,
  Music,
  Package,
  ParkingCircle,
  Pencil,
  Percent,
  Phone,
  PhoneCall,
  Plus,
  Printer,
  Radio,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  GitCompare,
  Scale,
  Maximize2,
  Send,
  Settings,
  Share2,
  Sheet,
  ShieldCheck,
  ShoppingCart,
  SkipForward,
  SlidersHorizontal,
  Sparkles,
  Speaker,
  Square,
  Star,
  Store,
  Tag,
  Timer,
  Trash2,
  TriangleAlert,
  Truck,
  Undo2,
  Upload,
  User,
  Users,
  Video,
  VolumeX,
  Wallet,
  Wrench,
  X,
  Youtube,
  Zap,
};
